import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-charm-muted">
      <Loader2 className="w-8 h-8 animate-spin text-charm-brand mb-4" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
