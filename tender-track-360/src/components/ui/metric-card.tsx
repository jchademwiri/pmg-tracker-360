import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
}: MetricCardProps) {
  const formatTrendValue = (value: number) => {
    const formatted = Math.abs(value).toFixed(1)
    return `${formatted}%`
  }

  const getTrendIcon = () => {
    if (!trend) return null

    if (trend.value === 0) {
      return <Minus className="h-3 w-3 text-muted-foreground" />
    }

    return trend.isPositive ? (
      <TrendingUp className="h-3 w-3 text-green-600" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-600" />
    )
  }

  const getTrendColor = () => {
    if (!trend) return ""

    if (trend.value === 0) return "text-muted-foreground"
    return trend.isPositive ? "text-green-600" : "text-red-600"
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={cn("flex items-center text-xs mt-2", getTrendColor())}>
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