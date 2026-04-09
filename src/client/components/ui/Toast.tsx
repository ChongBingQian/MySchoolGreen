import toast, { Toaster as HotToaster, ToastOptions } from 'react-hot-toast';

// Re-export the Toaster component with default styling
export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#2c3138',
          color: '#edf1f5',
          border: '1px solid #4f5661',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          padding: '0.75rem 1rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
        },
        success: {
          iconTheme: {
            primary: '#418228',
            secondary: '#edf1f5',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#edf1f5',
          },
        },
      }}
    />
  );
}

// Helper functions for consistent toast usage
export const showToast = {
  success: (message: string, options?: ToastOptions) => toast.success(message, options),
  error: (message: string, options?: ToastOptions) => toast.error(message, options),
  loading: (message: string, options?: ToastOptions) => toast.loading(message, options),
  custom: (message: string, options?: ToastOptions) => toast(message, options),
  dismiss: (toastId?: string) => toast.dismiss(toastId),
  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    },
    options?: ToastOptions
  ) => toast.promise(promise, msgs, options),
};

// Re-export original toast for advanced usage
export { toast };
