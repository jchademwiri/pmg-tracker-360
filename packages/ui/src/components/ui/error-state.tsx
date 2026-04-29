import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  [key: string]: unknown;
}

export function ErrorState({ title = "Something went wrong", message, description, action, className }: ErrorStateProps) {
  const body = message ?? description;
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 p-8 text-center", className)}>
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="font-medium">{title}</p>
      {body && <p className="text-sm text-muted-foreground">{body}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 text-sm underline text-primary hover:opacity-80"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
