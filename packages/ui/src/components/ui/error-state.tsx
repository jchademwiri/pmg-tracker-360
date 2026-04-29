import { AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", message, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 p-8 text-center", className)}>
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="font-medium">{title}</p>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
