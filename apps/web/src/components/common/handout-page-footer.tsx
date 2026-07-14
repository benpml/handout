import { cn } from "@/lib/utils"

export function HandoutPageFooter({ className }: { className?: string }) {
  return (
    <footer
      aria-label="Made with Handout"
      className={cn(
        "mt-auto flex h-11 shrink-0 items-center justify-center gap-2 border-t border-border-subtle text-sm text-muted-foreground",
        className
      )}
    >
      <span>Made with</span>
      <span
        aria-label="Handout"
        role="img"
        className="h-[17px] w-[85px] bg-muted-foreground"
        style={{
          WebkitMask: "url('/handout-logo.svg') center / contain no-repeat",
          mask: "url('/handout-logo.svg') center / contain no-repeat",
        }}
      />
    </footer>
  )
}
