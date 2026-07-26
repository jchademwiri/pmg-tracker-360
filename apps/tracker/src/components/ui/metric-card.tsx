import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export type MetricVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';

interface VariantStyles {
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  valueColor?: string;
}

const VARIANT_MAP: Record<MetricVariant, VariantStyles> = {
  primary: {
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    iconBorder: 'border-indigo-500/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    valueColor: 'text-indigo-600 dark:text-indigo-400',
  },
  success: {
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    iconBorder: 'border-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    valueColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    iconBorder: 'border-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    valueColor: 'text-amber-600 dark:text-amber-400',
  },
  danger: {
    iconBg: 'bg-red-500/10 dark:bg-red-500/15',
    iconBorder: 'border-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    valueColor: 'text-red-600 dark:text-red-400',
  },
  info: {
    iconBg: 'bg-sky-500/10 dark:bg-sky-500/15',
    iconBorder: 'border-sky-500/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
    valueColor: 'text-sky-600 dark:text-sky-400',
  },
  default: {
    iconBg: 'bg-accent/50',
    iconBorder: 'border-border/50',
    iconColor: 'text-muted-foreground',
  },
};

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
  variant?: MetricVariant
  className?: string
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
  variant = 'default',
  className,
}: MetricCardProps) {
  const styles = VARIANT_MAP[variant];

  const formatTrendValue = (val: number) => {
    const formatted = Math.abs(val).toFixed(1)
    return `${formatted}%`
  }

  const getTrendIcon = () => {
    if (!trend) return null

    if (trend.value === 0) {
      return <Minus className="h-3 w-3 text-muted-foreground" />
    }

    return trend.isPositive ? (
      <TrendingUp className="h-3 w-3 text-emerald-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    )
  }

  const getTrendColor = () => {
    if (!trend) return ""

    if (trend.value === 0) return "text-muted-foreground"
    return trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
  }

  return (
    <Card className={cn("transition-all duration-200 hover:border-foreground/20 hover:shadow-sm bg-card/80 backdrop-blur-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center size-9 rounded-lg border transition-colors shrink-0",
              styles.iconBg,
              styles.iconBorder,
              styles.iconColor
            )}
          >
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tracking-tight", styles.valueColor)}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground/80 mt-1 font-normal">{description}</p>
        )}
        {trend && (
          <div className={cn("flex items-center text-xs font-medium mt-2", getTrendColor())}>
            {getTrendIcon()}
            <span className="ml-1">
              {formatTrendValue(trend.value)} from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}