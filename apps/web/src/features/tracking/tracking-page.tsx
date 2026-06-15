import { IconEye, IconLink, IconMouse, IconSearch, IconWorldSearch } from "@tabler/icons-react"

import { trackingEvents } from "@/data/sample-data"
import type { TrackingEventType } from "@/data/sample-data"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"

const trackingEventIcons: Record<TrackingEventType, typeof IconEye> = {
  site_viewed: IconEye,
  button_clicked: IconMouse,
  link_preview_loaded: IconWorldSearch,
  scroll_depth: IconLink,
}

export function TrackingPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Tracking</h1>
        <p className="text-sm text-muted-foreground">Searchable prospect activity across published sites.</p>
      </div>
      <div className="relative max-w-md">
        <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search events" />
      </div>
      <ItemGroup>
        {trackingEvents.map((event) => {
          const Icon = trackingEventIcons[event.type]

          return (
            <Item key={event.id} variant="outline">
              <ItemMedia variant="icon">
                <Icon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  {event.eventName}
                  <Badge variant="secondary">{event.timestamp}</Badge>
                </ItemTitle>
                <ItemDescription>
                  {event.siteName} · {event.target}
                </ItemDescription>
              </ItemContent>
            </Item>
          )
        })}
      </ItemGroup>
    </div>
  )
}
