// frontend/src/components/ui/Toast.tsx
import { toast } from "sonner";

// sonner v2 doesn't have useToast - use toast directly
export const useToast = () => {
  return {
    success: (
      message: string,
      options?: { description?: string; action?: { label: string; onClick: () => void } },
    ) => {
      return toast.success(message, options);
    },
    error: (
      message: string,
      options?: { description?: string; action?: { label: string; onClick: () => void } },
    ) => {
      return toast.error(message, options);
    },
    warning: (message: string, options?: { description?: string }) => {
      return toast.warning(message, options);
    },
    info: (message: string, options?: { description?: string }) => {
      return toast.info(message, options);
    },
    loading: (message: string, options?: { description?: string }) => {
      return toast.loading(message, options);
    },
    promise: <T,>(
      promise: Promise<T>,
      messages: { loading: string; success: string; error: string },
    ) => {
      return toast.promise(promise, messages);
    },
    dismiss: (toastId?: string | number) => {
      return toast.dismiss(toastId);
    },
  };
};

// Also export toast directly for convenience
export { toast };

export default useToast;
