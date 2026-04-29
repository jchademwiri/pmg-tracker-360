import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "../../lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  className?: string;
}

export function MetricCard({ title, value, description, icon, trend, className }: MetricCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <p className={cn("text-xs mt-1", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
            {trend.value >= 0 ? "+" : ""}{trend.value.toFixed(1)}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
