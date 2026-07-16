import { IconCheck } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PublishUpgradeDialogProps = {
  canManageBilling: boolean
  onOpenChange: (open: boolean) => void
  onViewPlans: () => void
  open: boolean
}

export function PublishUpgradeDialog({
  canManageBilling,
  onOpenChange,
  onViewPlans,
  open,
}: PublishUpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade to publish</DialogTitle>
          <DialogDescription>
            {canManageBilling
              ? "This workspace is on the Free plan. Upgrade to Core to publish this site and make its link available."
              : "This workspace is on the Free plan. Ask a workspace admin to upgrade to Core before publishing."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <IconCheck />
            <span>Publish and update live sites</span>
          </div>
          <div className="flex items-center gap-2">
            <IconCheck />
            <span>Share unlimited recipient copies</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Not now</Button>
          </DialogClose>
          {canManageBilling ? (
            <Button onClick={onViewPlans}>View Core plan</Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
