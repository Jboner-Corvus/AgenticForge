import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn, toastVariants } from "@/lib/utils";

interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  action?: React.ReactNode;
  children?: React.ReactNode;
  description?: React.ReactNode;
  id: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ children, className, variant, ...props }, ref) => {
    return (
      <div
        className={cn(toastVariants({ variant }), className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Toast.displayName = "Toast";

export { Toast, type ToastProps };