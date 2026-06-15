import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  IconArrowRight,
  IconChartBar,
  IconCirclePlus,
  IconExternalLink,
  IconRefresh,
  IconWorldLongitude,
} from "@tabler/icons-react"
import type { SiteListItem } from "@lightsite/contracts"

import { PageHeader } from "@/components/common/page-header"
import { SiteStatusBadge } from "@/components/common/status-badge"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useActiveWorkspace } from "@/features/app-bootstrap/app-bootstrap-hooks"
import { getApiErrorMessage } from "@/lib/api/errors"
import { queryKeys } from "@/lib/api/query-keys"

import { listSites } from "./api"
import { CreateSiteDialog } from "./components/create-site-dialog"

export function DashboardPage() {
  const activeWorkspace = useActiveWorkspace()
  const sitesQuery = useQuery({
    queryKey: queryKeys.sites(activeWorkspace.id),
    queryFn: ({ signal }) => listSites(signal),
  })
  const siteMetrics = useMemo(
    () => getSiteMetrics(sitesQuery.data?.sites ?? []),
    [sitesQuery.data?.sites],
  )

  return (
    <div className="flex min-h-full flex-col gap-5 px-6 pt-5 pb-6">
      <PageHeader
        title="Dashboard"
        description={`Workspace overview for ${activeWorkspace.name}.`}
        actions={
          <CreateSiteDialog
            workspaceId={activeWorkspace.id}
            workspaceSlug={activeWorkspace.slug}
            trigger={
              <Button size="compact">
                <IconCirclePlus data-icon="inline-start" />
                New site
              </Button>
            }
          />
        }
      />

      {sitesQuery.isLoading ? <DashboardLoadingState /> : null}
      {sitesQuery.isError ? (
        <DashboardErrorState
          message={getApiErrorMessage(sitesQuery.error, "Dashboard could not be loaded.")}
          onRetry={() => void sitesQuery.refetch()}
        />
      ) : null}
      {sitesQuery.isSuccess ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            {siteMetrics.recentSite ? (
              <RecentSiteCard
                site={siteMetrics.recentSite}
                workspaceSlug={activeWorkspace.slug}
              />
            ) : (
              <FirstSiteCard
                workspaceId={activeWorkspace.id}
                workspaceSlug={activeWorkspace.slug}
              />
            )}

            <Card>
              <CardHeader>
                <CardDescription>Workspace state</CardDescription>
                <CardTitle>{siteMetrics.publishedCount} live sites</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <QueueRow label="Workspace slug" value={activeWorkspace.slug} />
                <QueueRow label="Your role" value={formatRole(activeWorkspace.role)} />
                <QueueRow label="Tracked sites" value={String(siteMetrics.totalCount)} />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Total sites"
              value={String(siteMetrics.totalCount)}
              detail="All draft, published, and archived site shells in this workspace."
            />
            <MetricCard
              label="Published"
              value={String(siteMetrics.publishedCount)}
              detail="Public links that can serve a published snapshot."
            />
            <MetricCard
              label="Drafts"
              value={String(siteMetrics.draftCount)}
              detail="Private work in progress that is not live for prospects."
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <TrackingPreviewCard />
            <Card>
              <CardHeader>
                <CardTitle>Build queue</CardTitle>
                <CardDescription>Track 2 surfaces wired to current contracts.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <QueueRow label="Active sites" value={String(siteMetrics.activeCount)} />
                <QueueRow label="Archived sites" value={String(siteMetrics.archivedCount)} />
                <QueueRow label="Latest update" value={formatSiteDate(siteMetrics.recentSite)} />
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  )
}

function RecentSiteCard({
  site,
  workspaceSlug,
}: {
  site: SiteListItem
  workspaceSlug: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Most recent site</CardDescription>
        <CardTitle className="flex min-w-0 items-center gap-2 text-xl">
          <span className="truncate">{site.name}</span>
          <SiteStatusBadge status={site.status} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Status" value={formatSiteStatus(site.status)} />
          <Metric label="Updated" value={formatSiteDate(site)} />
          <Metric label="Public path" value={`/${workspaceSlug}/${site.slug}`} />
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/editor/$siteId" params={{ siteId: site.id }}>
              Open editor
              <IconArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          {site.status === "published" ? (
            <Button variant="outline" asChild>
              <Link
                to="/$workspaceSlug/$siteSlug"
                params={{ workspaceSlug, siteSlug: site.slug }}
              >
                <IconExternalLink data-icon="inline-start" />
                Open public link
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <IconExternalLink data-icon="inline-start" />
              Open public link
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function FirstSiteCard({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string
  workspaceSlug: string
}) {
  return (
    <Card>
      <CardContent>
        <Empty className="min-h-[244px]">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconWorldLongitude />
            </EmptyMedia>
            <EmptyTitle>Create your first site</EmptyTitle>
            <EmptyDescription>
              Start with a private draft, then publish when the one-pager is ready to share.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateSiteDialog workspaceId={workspaceId} workspaceSlug={workspaceSlug} />
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  )
}

function TrackingPreviewCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking preview</CardTitle>
        <CardDescription>
          Analytics will separate human visits from preview and bot activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          <Item>
            <ItemMedia variant="icon">
              <IconChartBar />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Visits and engagement</ItemTitle>
              <ItemDescription>
                Time spent, scroll depth, clicks, and variant attribution will appear here once
                tracking summaries are available.
              </ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

function DashboardLoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </section>
    </div>
  )
}

function DashboardErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Dashboard could not be loaded</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
      <AlertAction>
        <Button variant="outline" size="compact" onClick={onRetry}>
          <IconRefresh data-icon="inline-start" />
          Retry
        </Button>
      </AlertAction>
    </Alert>
  )
}

function MetricCard({
  detail,
  label,
  value,
}: {
  detail: string
  label: string
  value: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{detail}</CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-lg font-medium">{value}</div>
    </div>
  )
}

function QueueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  )
}

function getSiteMetrics(sites: SiteListItem[]) {
  const recentSite =
    sites.toSorted((left, right) => getSiteUpdatedAt(right) - getSiteUpdatedAt(left))[0] ?? null
  const publishedCount = sites.filter((site) => site.status === "published").length
  const draftCount = sites.filter((site) => site.status === "draft").length
  const archivedCount = sites.filter((site) => site.status === "archived").length

  return {
    activeCount: sites.length - archivedCount,
    archivedCount,
    draftCount,
    publishedCount,
    recentSite,
    totalCount: sites.length,
  }
}

function getSiteUpdatedAt(site: SiteListItem) {
  const value = site.updatedAt ?? site.createdAt

  if (!value) {
    return 0
  }

  const timestamp = Date.parse(value)

  return Number.isFinite(timestamp) ? timestamp : 0
}

function formatSiteDate(site: SiteListItem | null) {
  const value = site?.updatedAt ?? site?.createdAt

  if (!value) {
    return "No activity"
  }

  const timestamp = Date.parse(value)

  if (!Number.isFinite(timestamp)) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp)
}

function formatRole(role: string) {
  return role === "admin" ? "Admin" : "User"
}

function formatSiteStatus(status: SiteListItem["status"]) {
  if (status === "published") {
    return "Published"
  }

  if (status === "archived") {
    return "Archived"
  }

  return "Draft"
}
