import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  IconBuilding,
  IconExternalLink,
  IconLock,
  IconRefresh,
  IconUserCircle,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { RoleBadge } from "@/components/common/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  completeAccountSetup,
} from "@/features/app-bootstrap/api"
import { useActiveWorkspace, useAppBootstrap } from "@/features/app-bootstrap/app-bootstrap-hooks"
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/errors"
import { queryKeys } from "@/lib/api/query-keys"

export function SettingsPage() {
  const bootstrap = useAppBootstrap()
  const activeWorkspace = useActiveWorkspace()

  return (
    <div className="flex min-h-full flex-col gap-5 px-6 pt-5 pb-6">
      <PageHeader
        title="Settings"
        description="Manage user-owned profile details separately from workspace-owned company details."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <ProfileSettingsCard
          key={`${bootstrap.user.id}:${bootstrap.user.name ?? ""}`}
          email={bootstrap.user.email}
          name={bootstrap.user.name ?? ""}
        />
        <WorkspaceSettingsCard
          isAdmin={activeWorkspace.role === "admin"}
          logoUrl={activeWorkspace.logoUrl}
          name={activeWorkspace.name}
          role={activeWorkspace.role}
          slug={activeWorkspace.slug}
          websiteDomain={activeWorkspace.websiteDomain}
        />
      </section>
    </div>
  )
}

function ProfileSettingsCard({
  email,
  name,
}: {
  email: string
  name: string
}) {
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState(name)
  const trimmedDisplayName = displayName.trim()
  const nameError = trimmedDisplayName ? null : "Name is required."
  const isDirty = trimmedDisplayName !== name.trim()
  const profileMutation = useMutation({
    mutationFn: completeAccountSetup,
    onSuccess: async (nextBootstrap) => {
      setDisplayName(nextBootstrap.user.name ?? trimmedDisplayName)
      queryClient.setQueryData(queryKeys.me(), nextBootstrap)
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() })
      toast.success("Profile saved.")
    },
  })
  const serverNameError = getApiFieldError(profileMutation.error, "displayName")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUserCircle />
          Profile
        </CardTitle>
        <CardDescription>Profile changes do not change workspace roles or access.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()

            if (!isDirty || nameError || profileMutation.isPending) {
              return
            }

            profileMutation.mutate({ displayName })
          }}
        >
          <FieldSet>
            <FieldGroup>
              <Field data-invalid={Boolean(nameError || serverNameError) || undefined}>
                <FieldLabel htmlFor="settings-profile-name">Name</FieldLabel>
                <Input
                  id="settings-profile-name"
                  value={displayName}
                  onChange={(event) => {
                    setDisplayName(event.target.value)
                    profileMutation.reset()
                  }}
                  aria-invalid={Boolean(nameError || serverNameError) || undefined}
                  disabled={profileMutation.isPending}
                />
                {nameError || serverNameError ? (
                  <FieldError>{serverNameError ?? nameError}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="settings-profile-email">Email</FieldLabel>
                <Input id="settings-profile-email" value={email} readOnly />
                <FieldDescription>
                  Email changes require a verified account-management flow.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>

          {profileMutation.isError && !serverNameError ? (
            <Alert variant="destructive">
              <AlertTitle>Profile was not saved</AlertTitle>
              <AlertDescription>
                {getApiErrorMessage(profileMutation.error, "Try again in a moment.")}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={!isDirty || Boolean(nameError) || profileMutation.isPending}>
              {profileMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
              Save profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function WorkspaceSettingsCard({
  isAdmin,
  logoUrl,
  name,
  role,
  slug,
  websiteDomain,
}: {
  isAdmin: boolean
  logoUrl: string | null
  name: string
  role: "admin" | "user"
  slug: string
  websiteDomain: string
}) {
  const workspaceInitials = useMemo(() => initialsForName(name), [name])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBuilding />
          Workspace
        </CardTitle>
        <CardDescription>Workspace identity controls future site defaults and public URLs.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 rounded-lg">
            {logoUrl ? (
              <AvatarImage src={logoUrl} alt={`${name} logo`} className="rounded-lg object-contain p-1" />
            ) : null}
            <AvatarFallback className="rounded-lg">{workspaceInitials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-medium">{name}</div>
            <div className="text-sm text-muted-foreground">{websiteDomain}</div>
          </div>
          <RoleBadge role={role} />
        </div>

        <Separator />

        {!isAdmin ? (
          <Alert>
            <IconLock />
            <AlertTitle>Workspace settings are admin-only</AlertTitle>
            <AlertDescription>
              You can view workspace identity but cannot make workspace-level changes.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <IconLock />
            <AlertTitle>Workspace details are read-only</AlertTitle>
            <AlertDescription>
              Changes are blocked until slug and public-link safeguards are available.
            </AlertDescription>
          </Alert>
        )}

        <FieldSet>
          <FieldGroup>
            <Field data-disabled>
              <FieldLabel htmlFor="settings-workspace-name">Workspace name</FieldLabel>
              <Input id="settings-workspace-name" value={name} readOnly disabled />
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="settings-workspace-slug">Workspace slug</FieldLabel>
              <Input id="settings-workspace-slug" value={slug} readOnly disabled />
              <FieldDescription>
                Slug changes stay blocked after public links exist.
              </FieldDescription>
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="settings-workspace-website">Website</FieldLabel>
              <Input id="settings-workspace-website" value={websiteDomain} readOnly disabled />
              <FieldDescription>
                Website powers logo lookup and future enrichment.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled>
            <IconRefresh data-icon="inline-start" />
            Refresh logo
          </Button>
          <Button variant="outline" asChild>
            <Link to="/team">
              Open team
              <IconExternalLink data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function initialsForName(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")

  return initials || "LS"
}
