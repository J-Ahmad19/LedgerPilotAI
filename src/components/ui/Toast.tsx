import * as React from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export type ToastType = 'default' | 'success' | 'error' | 'warning';

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  onClose: (id: string) => void;
}

export function Toast({ id, title, description, type = 'default', onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div className={cn(
      "pointer-events-auto w-full max-w-sm overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-black ring-opacity-5 mb-4 border",
      {
        "border-charm-border": type === 'default',
        "border-green-200 bg-green-50": type === 'success',
        "border-red-200 bg-red-50": type === 'error',
        "border-yellow-200 bg-yellow-50": type === 'warning',
      }
    )}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {title && <p className={cn("text-sm font-medium", {
              "text-charm-heading": type === 'default',
              "text-green-800": type === 'success',
              "text-red-800": type === 'error',
              "text-yellow-800": type === 'warning',
            })}>{title}</p>}
            {description && <p className={cn("mt-1 text-sm", {
              "text-charm-body": type === 'default',
              "text-green-700": type === 'success',
              "text-red-700": type === 'error',
              "text-yellow-700": type === 'warning',
            })}>{description}</p>}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-charm-brand focus:ring-offset-2"
              onClick={() => onClose(id)}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
