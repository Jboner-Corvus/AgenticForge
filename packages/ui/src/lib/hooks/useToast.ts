"use client";

// Inspired by react-hot-toast library
import * as React from "react";

import type { ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = {
  description?: React.ReactNode;
  id: string;
  title?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success';
} & ToastProps;

let count = 0;

const ActionType = {
  ADD_TOAST: "ADD_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
} as const;

type Action =
  | {
      toast: Partial<ToasterToast>;
      type: "UPDATE_TOAST";
    }
  | {
      toast: ToasterToast;
      type: "ADD_TOAST";
    }
  | {
      toastId?: ToasterToast["id"];
      type: "DISMISS_TOAST";
    }
  | {
      toastId?: ToasterToast["id"];
      type: "REMOVE_TOAST";
    };

interface State {
  toasts: ToasterToast[];
}

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      toastId: toastId,
      type: ActionType.REMOVE_TOAST,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case ActionType.DISMISS_TOAST: {
      const toastId = action.toastId;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }

    case ActionType.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    case ActionType.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

type Toast = Omit<ToasterToast, "id">;

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast(props: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      toast: { ...props, id },
      type: ActionType.UPDATE_TOAST,
    });
  const dismiss = () =>
    dispatch({ toastId: id, type: ActionType.DISMISS_TOAST });

  dispatch({
    toast: {
      ...props,
      id,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
      open: true,
    },
    type: ActionType.ADD_TOAST,
  });

  return {
    dismiss,
    id: id,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    dismiss: (toastId?: string) =>
      dispatch({ toastId, type: ActionType.DISMISS_TOAST }),
    toast,
  };
}

export { toast, useToast };