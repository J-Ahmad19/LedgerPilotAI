import { AlertTriangle } from "lucide-react";
import { Button } from "../Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "An error occurred while loading this content.",
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-[24px] bg-red-50 border border-red-100">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
      <p className="text-sm text-red-700 mb-6 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="danger" onClick={onRetry}>Try Again</Button>
      )}
    </div>
  );
}
