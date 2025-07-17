import { Toast } from "@/components/ui/toast";
import { useToast } from "@/lib/hooks/useToast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} id={id} {...props}>
            <div className="grid gap-1">
              {title && <p>{title}</p>}
              {description && (
                <p>{description}</p>
              )}
            </div>
            {action}
          </Toast>
        );
      })}
    </>
  );
}