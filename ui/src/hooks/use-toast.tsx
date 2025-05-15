import * as React from "react";
import {
    ToastActionElement,
    ToastProps,
} from "../components/ui/toast";

type ToastOptions = ToastProps & {
    title?: string;
    description?: string;
    action?: ToastActionElement;
};

type Toast = ToastOptions & {
    id: string;
};

type ToastContextType = {
    toasts: Toast[];
    toast: (options: ToastOptions) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const toast = React.useCallback(({ title, description, variant, action, ...props }: ToastOptions) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = {
            id,
            title,
            description,
            variant,
            action,
            ...props,
        };
        setToasts((prevToasts) => [...prevToasts, newToast]);

        // Auto remove toast after 5 seconds
        setTimeout(() => {
            setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const value = React.useMemo(() => ({
        toasts,
        toast,
    }), [toasts, toast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export const toast = ({ title, description, variant, action, ...props }: ToastOptions) => {
    const { toast: toastFn } = useToast();
    return toastFn({ title, description, variant, action, ...props });
}; 