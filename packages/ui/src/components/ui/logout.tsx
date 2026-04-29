"use client";

import { LogOut } from "lucide-react";
import { Button } from "./button";

interface LogoutProps {
  onLogout?: () => void;
  className?: string;
}

export default function Logout({ onLogout, className }: LogoutProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={onLogout}
      aria-label="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
