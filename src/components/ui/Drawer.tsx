import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Drawer({ isOpen, onClose, title, children, className }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex justify-end">
      <div 
        className={cn(
          "bg-charm-surface w-full max-w-2xl h-full border-l border-charm-border shadow-2xl flex flex-col transform transition-transform duration-300",
          "animate-in slide-in-from-right",
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-charm-border flex items-center justify-between sticky top-0 bg-charm-surface z-10">
          <h2 className="text-xl font-bold text-charm-heading font-display">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-charm-card rounded-full text-charm-muted hover:text-charm-body transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-charm-base">
          {children}
        </div>
      </div>
    </div>
  );
}
