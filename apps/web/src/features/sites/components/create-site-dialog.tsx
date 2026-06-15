import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { IconCirclePlus } from "@tabler/icons-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage, getApiFieldError } from "@/lib/api/errors"
import { queryKeys } from "@/lib/api/query-keys"

import { createSite } from "../api"

type CreateSiteDialogProps = {
  trigger?: React.ReactNode
  workspaceId: string
  workspaceSlug: string
}

export function CreateSiteDialog({
  trigger,
  workspaceId,
  workspaceSlug,
}: CreateSiteDialogProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const slug = slugify(name) || "new-site"
  const createSiteMutation = useMutation({
    mutationFn: createSite,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sites(workspaceId) })
      setOpen(false)
      setName("")
      await navigate({
        to: "/editor/$siteId",
        params: { siteId: data.site.id },
      })
    },
  })
  const nameError = getApiFieldError(createSiteMutation.error, "name")
  const hasNameError = Boolean(nameError)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="compact">
            <IconCirclePlus data-icon="inline-start" />
            New site
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create site</DialogTitle>
          <DialogDescription>
            Start with a private draft. Publishing creates the prospect-facing link.
          </DialogDescription>
        </DialogHeader>
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault()
            createSiteMutation.mutate({ name })
          }}
        >
          <FieldGroup>
            <Field data-invalid={hasNameError || undefined}>
              <FieldLabel htmlFor="site-name">Site name</FieldLabel>
              <Input
                id="site-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  if (createSiteMutation.isError) {
                    createSiteMutation.reset()
                  }
                }}
                placeholder="Acme rollout brief"
                aria-invalid={hasNameError || undefined}
                disabled={createSiteMutation.isPending}
              />
              {nameError ? <FieldError>{nameError}</FieldError> : null}
              <FieldDescription>
                Draft URL preview: /{workspaceSlug}/{slug}
              </FieldDescription>
            </Field>
          </FieldGroup>
          {createSiteMutation.isError && !nameError ? (
            <Alert variant="destructive">
              <AlertTitle>Site was not created</AlertTitle>
              <AlertDescription>
                {getApiErrorMessage(createSiteMutation.error, "Try again in a moment.")}
              </AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={createSiteMutation.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSiteMutation.isPending}>
              {createSiteMutation.isPending ? <Spinner data-icon="inline-start" /> : null}
              Create and open editor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
