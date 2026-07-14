import { useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  IconActivity,
  IconLock,
  IconPlayerRecord,
} from "@tabler/icons-react"
import type { WorkspacePlan } from "@handout/contracts"
import {
  sanitizeTrackingPrivacyPolicyUrl,
  type SiteContent,
  type SiteTrackingConsentPopup,
} from "@handout/site-document"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldContent, FieldDescription, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  getTrackingV2SiteSettings,
  updateTrackingV2SiteSettings,
} from "@/features/tracking/api"
import { getApiErrorMessage } from "@/lib/api/errors"
import { queryKeys } from "@/lib/api/query-keys"

import { trackingConsentOptions } from "../model"

type TrackingSettingsProps = {
  canManage: boolean
  content: SiteContent
  onChange: (content: SiteContent) => void
  plan: WorkspacePlan
  siteId: string
  workspaceId: string
}

export function TrackingSettings({
  canManage,
  content,
  onChange,
  plan,
  siteId,
  workspaceId,
}: TrackingSettingsProps) {
  const queryClient = useQueryClient()
  const [agreementOpen, setAgreementOpen] = useState(false)
  const settingsQuery = useQuery({
    queryKey: queryKeys.trackingSiteSettings(workspaceId, siteId),
    queryFn: ({ signal }) => getTrackingV2SiteSettings(workspaceId, siteId, signal),
    enabled: Boolean(workspaceId && siteId),
  })
  const currentTracking = settingsQuery.data
    ? settingsQuery.data.siteOverride ?? settingsQuery.data.effective
    : null
  const activityMutation = useMutation({
    mutationFn: (enabled: boolean) => {
      if (!currentTracking) throw new Error("Tracking settings are not ready.")
      return updateTrackingV2SiteSettings(workspaceId, siteId, {
        ...currentTracking,
        enabled,
        ...(!enabled ? { recordingEnabled: false } : {}),
        ...(enabled && currentTracking.recordingEnabled ? { recordingDisclosureAccepted: true } : {}),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.trackingSiteSettings(workspaceId, siteId),
      })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Activity tracking could not be updated.")),
  })
  const replayMutation = useMutation({
    mutationFn: (enabled: boolean) => {
      if (!currentTracking) throw new Error("Tracking settings are not ready.")
      return updateTrackingV2SiteSettings(workspaceId, siteId, {
        ...currentTracking,
        enabled: enabled ? true : currentTracking.enabled,
        recordingEnabled: enabled,
        ...(enabled ? { recordingDisclosureAccepted: true } : {}),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.trackingSiteSettings(workspaceId, siteId),
      })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Session replay could not be updated.")),
  })
  const trackingEnabled = activityMutation.isPending
    ? activityMutation.variables
    : currentTracking?.enabled ?? false
  const isPro = plan === "pro"
  const replayAvailable = isPro && settingsQuery.data?.recordingAvailable === true
  const replayEnabled = replayMutation.isPending
    ? replayMutation.variables
    : replayAvailable && (currentTracking?.recordingEnabled ?? false)
  const selectedConsent = trackingConsentOptions.find(
    (option) => option.value === content.settings.trackingConsentPopup,
  ) ?? trackingConsentOptions[0]
  const privacyPolicyUrl = content.settings.trackingPrivacyPolicyUrl
  const privacyPolicyUrlValid = sanitizeTrackingPrivacyPolicyUrl(privacyPolicyUrl) !== null

  const updateSettings = (settings: Partial<SiteContent["settings"]>) => {
    onChange({ ...content, settings: { ...content.settings, ...settings } })
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-4 pt-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Tracking</h2>
          <p className="text-xs leading-5 text-muted-foreground">
            Configure visitor analytics and consent. <a className="underline underline-offset-2" href="/terms" target="_blank" rel="noreferrer">Terms</a>
          </p>
        </div>
      </div>

      <Card className="gap-0 overflow-hidden rounded-xl bg-card py-0">
        <SettingRow
          description="Track site opens, button clicks, links, and tabs."
          icon={<IconActivity />}
          title="Activity tracking"
          control={settingsQuery.isLoading ? (
            <Skeleton className="h-[18px] w-8 rounded-full" />
          ) : (
            <Switch
              aria-label="Activity tracking"
              checked={trackingEnabled}
              disabled={!canManage || !currentTracking || activityMutation.isPending}
              onCheckedChange={(checked) => activityMutation.mutate(checked)}
            />
          )}
        />
        <div className="mx-3 border-t" />
        <SettingRow
          description={!isPro
            ? "See cursor movement, clicks, and scrolling across a visit."
            : replayAvailable
              ? "Record consented visitor sessions to understand how they use your site."
              : "Replay storage is not configured for this environment."}
          disabled={!replayAvailable}
          icon={<IconPlayerRecord />}
          title="Session replay"
          badge={!isPro ? <Badge variant="secondary" className="bg-blue-background text-blue-foreground"><IconLock data-icon="inline-start" />Upgrade</Badge> : null}
          control={(
            <Switch
              aria-label="Session replay"
              checked={replayEnabled}
              disabled={!canManage || !replayAvailable || !currentTracking || replayMutation.isPending}
              onCheckedChange={(checked) => {
                if (checked) {
                  if (!privacyPolicyUrlValid) {
                    toast.error("Add a valid HTTPS privacy policy URL before enabling session replay.")
                    return
                  }
                  setAgreementOpen(true)
                } else {
                  replayMutation.mutate(false)
                }
              }}
            />
          )}
        />
      </Card>

      <Field className="gap-2">
        <FieldTitle>Privacy policy URL</FieldTitle>
        <Input
          aria-invalid={privacyPolicyUrl.length > 0 && !privacyPolicyUrlValid}
          disabled={!canManage}
          inputMode="url"
          onChange={(event) => updateSettings({ trackingPrivacyPolicyUrl: event.target.value })}
          placeholder="https://example.com/privacy"
          type="url"
          value={privacyPolicyUrl}
        />
        <FieldDescription className="text-xs">
          Required for the visitor consent popup and session replay.
        </FieldDescription>
      </Field>

      <Field className="gap-3">
        <FieldTitle>Tracking consent popup</FieldTitle>
        <Select
          value={content.settings.trackingConsentPopup}
          onValueChange={(value) => updateSettings({
            trackingConsentPopup: value as SiteTrackingConsentPopup,
          })}
        >
          <SelectTrigger className="h-auto min-h-[60px] w-full rounded-xl px-3 py-2" aria-label="Tracking consent popup">
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
              <span className="text-sm font-medium text-foreground">{selectedConsent.label}</span>
              <span className="line-clamp-2 text-xs whitespace-normal text-muted-foreground">
                {selectedConsent.description}
              </span>
            </span>
          </SelectTrigger>
          <SelectContent position="popper" align="end" className="w-[336px]">
            {trackingConsentOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="py-2"
                disabled={replayEnabled && option.value !== "popup-b"}
              >
                <span className="flex flex-col items-start">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {content.settings.trackingConsentPopup === "none" ? null : (
          <ConsentPopupPreview
            privacyPolicyUrl={sanitizeTrackingPrivacyPolicyUrl(privacyPolicyUrl)}
            variant={content.settings.trackingConsentPopup}
          />
        )}
      </Field>

      <ReplayAgreementDialog
        open={agreementOpen}
        onOpenChange={setAgreementOpen}
        onAgree={() => {
          if (content.settings.trackingConsentPopup !== "popup-b") {
            updateSettings({ trackingConsentPopup: "popup-b" })
          }
          replayMutation.mutate(true)
          setAgreementOpen(false)
        }}
      />
    </div>
  )
}

function SettingRow({
  badge,
  control,
  description,
  disabled = false,
  icon,
  title,
}: {
  badge?: ReactNode
  control: ReactNode
  description: string
  disabled?: boolean
  icon: ReactNode
  title: string
}) {
  return (
    <Field orientation="horizontal" className="items-start gap-3 px-3 py-3.5" data-disabled={disabled || undefined}>
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <FieldContent className={disabled ? "opacity-60" : undefined}>
        <div className="flex items-center gap-2">
          <FieldTitle>{title}</FieldTitle>
          {badge}
        </div>
        <FieldDescription className="text-xs leading-4">{description}</FieldDescription>
      </FieldContent>
      <div className="mt-0.5">{control}</div>
    </Field>
  )
}

export function ConsentPopupPreview({
  privacyPolicyUrl,
  variant,
}: {
  privacyPolicyUrl: string | null
  variant: Exclude<SiteTrackingConsentPopup, "none">
}) {
  return (
    <div className="rounded-xl border bg-background p-3 shadow-sm">
      <div className="flex flex-col gap-3 rounded-xl bg-popover p-3 ring-1 ring-foreground/10">
        <div>
          <h3 className="text-sm font-medium">We value your privacy</h3>
          <p className="mt-1 text-xs leading-4 text-muted-foreground">
            This site uses cookies and other technology upon consent to help the owner understand how you use it, including session behavior and where you click and scroll. By selecting Allow and proceed, you consent to this as described in the {privacyPolicyUrl ? <a className="underline" href={privacyPolicyUrl} target="_blank" rel="noreferrer">Privacy Policy</a> : <span className="underline">Privacy Policy</span>}.
            {variant === "popup-a" ? <> You may decline and enter <span className="underline">here</span>.</> : null}
          </p>
        </div>
        <div className="flex gap-2">
          {variant === "popup-b" ? <Button className="flex-1" variant="outline" size="compact">Deny and proceed</Button> : null}
          <Button className="flex-1" size="compact">Allow and proceed</Button>
        </div>
      </div>
    </div>
  )
}

function ReplayAgreementDialog({
  onAgree,
  onOpenChange,
  open,
}: {
  onAgree: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const [agreed, setAgreed] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      onOpenChange(nextOpen)
      if (!nextOpen) setAgreed(false)
    }}>
      <DialogContent className="max-h-[calc(100svh-32px)] gap-4 rounded-2xl sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Enable session replay?</DialogTitle>
          <DialogDescription>
            You must read and agree to the following before proceeding.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[270px] rounded-xl border bg-card">
          <div className="space-y-3 p-3 text-xs leading-5 text-muted-foreground">
            <p>Session replay captures visible non-masked page content, clicks, cursor movement, scrolling, viewport changes, and timing.</p>
            <p>By enabling session replay, you and the organization you represent agree that:</p>
            <ol className="list-decimal space-y-2 pl-4">
              <li>You are solely responsible for determining and complying with all laws applicable to you, your sites, your recipients, and your use of session replay, including privacy, data protection, cookie and similar-technology, wiretap, and electronic communications laws.</li>
              <li>Before recording begins, you will give each recipient clear and conspicuous notice and obtain their freely given, specific, informed, unambiguous, and affirmative consent.</li>
              <li>Your notice will explain what is recorded, why it is recorded, how it is used and retained, and that Handout processes the recording on your behalf.</li>
              <li>You will retain verifiable evidence of who consented, when and how they consented, and the notice presented to them. You will make withdrawal as easy as consent and promptly stop recording and honor applicable privacy requests.</li>
              <li>You will not use session replay on services directed to children or where recordings may contain sensitive or regulated information, credentials, payment information, health information, or other content prohibited by Handout’s policies.</li>
              <li>You are responsible for your sites, notices, consent process, privacy policy, replay configuration, authorized users, recordings, exports, and anyone with whom you share them. Handout does not provide legal advice or determine whether your use is lawful.</li>
              <li>Handout may suspend or disable session replay where it reasonably believes your use violates these requirements, applicable law, or third-party rights.</li>
            </ol>
            <p>To the maximum extent permitted by law, you and your organization agree to defend, indemnify, and hold harmless Handout, its affiliates, and their personnel from claims, investigations, proceedings, penalties, fines, damages, losses, liabilities, costs, and reasonable legal fees arising from your use or misuse of session replay, your content or configuration, your failure to obtain or document valid consent, or your violation of applicable law or third-party rights.</p>
          </div>
        </ScrollArea>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 text-sm leading-5">
          <Checkbox checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} className="mt-0.5" />
          <span>I’m authorized to act for my organization and agree to the above, Session Replay Addendum, and Terms of Service.</span>
        </label>
        <DialogFooter>
          <Button className="w-full" disabled={!agreed} onClick={onAgree}>
            Agree and enable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
