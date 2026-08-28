import { FileSearch } from "lucide-react";
import { Button } from "../Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-charm-border rounded-[24px] bg-charm-surface/30">
      <div className="w-12 h-12 bg-charm-band rounded-full flex items-center justify-center text-charm-muted mb-4">
        {icon || <FileSearch className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-semibold text-charm-heading mb-2">{title}</h3>
      <p className="text-sm text-charm-muted mb-6 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
