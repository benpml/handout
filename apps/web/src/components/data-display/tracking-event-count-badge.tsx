import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function TrackingEventCountBadge({ count }: { count: number }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-border",
        count === 0 ? "text-tertiary-foreground" : "text-foreground"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          count === 0 ? "bg-neutral-alpha-a900" : "bg-success"
        )}
      />
      {count.toLocaleString()} {count === 1 ? "Event" : "Events"}
    </Badge>
  )
}
