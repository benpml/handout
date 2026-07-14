import {
  IconArrowRight,
  IconBolt,
  IconChartBar,
  IconCheck,
  IconClock,
  IconEye,
  IconFileText,
  IconLink,
  IconMessageCircle,
  IconPlayerPlay,
  IconSend,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Tracking", href: "#tracking" },
  { label: "Pricing", href: "#pricing" },
] as const

const proofPoints = [
  "Super easy.",
  "Build in minutes.",
  "Start for free.",
  "No card required.",
] as const

const steps = [
  {
    number: "01",
    title: "Collect the right content",
    description:
      "Bring decks, videos, links, proposals, and next steps into one focused place.",
    icon: IconLink,
  },
  {
    number: "02",
    title: "Shape the story",
    description:
      "Arrange everything into a polished one pager that feels built for the prospect.",
    icon: IconSparkles,
  },
  {
    number: "03",
    title: "Share and follow the signal",
    description:
      "Send one link, then see what buyers open, revisit, and share with their team.",
    icon: IconSend,
  },
] as const

const faqItems = [
  {
    question: "What can I add to a Handout?",
    answer:
      "Add the client-facing material that moves a deal forward—documents, videos, links, timelines, next steps, and supporting context—all inside one simple site.",
  },
  {
    question: "Does my prospect need an account?",
    answer:
      "No. Prospects open the link you send and view the experience directly. You control what they see and can update the site without sending a new link.",
  },
  {
    question: "What does Handout track?",
    answer:
      "Handout helps you understand meaningful buyer activity, including visits, return visits, content engagement, and sharing signals, so you know when to follow up.",
  },
  {
    question: "Can I start without a credit card?",
    answer:
      "Yes. You can create your account and start building for free. No card is required to get started.",
  },
] as const

export function MarketingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <MarketingHeader />
      <main>
        <Hero />
        <AudienceStrip />
        <HowItWorks />
        <ProductStory />
        <TrackingSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  )
}

function MarketingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-background/95 supports-[backdrop-filter]:bg-background/85 supports-[backdrop-filter]:backdrop-blur-lg">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 sm:px-8 lg:px-10">
        <a href="#top" aria-label="Handout home" className="shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img src="/handout-logo.svg" alt="Handout" className="h-[18px] w-[90px]" />
        </a>

        <nav aria-label="Primary navigation" className="order-3 flex w-full items-center justify-between gap-4 text-sm text-tertiary-foreground md:order-none md:w-auto md:justify-center md:gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="lg">
            <a href="/auth">Log in</a>
          </Button>
          <Button asChild size="lg">
            <a href="/auth?mode=sign-up">Sign up</a>
          </Button>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-5 pt-20 sm:px-8 sm:pt-28 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[760px] bg-[radial-gradient(ellipse_at_50%_34%,var(--selection-background)_0%,transparent_68%)]" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-tertiary-foreground shadow-xs">
          <IconBolt className="size-3.5 text-blue-foreground" aria-hidden="true" />
          One link. A clearer path to yes.
        </div>

        <h1 className="mt-7 max-w-5xl text-center text-[clamp(3.25rem,8vw,7.75rem)] leading-[0.92] font-semibold tracking-[-0.065em] text-balance">
          Build one pagers that close prospects.
        </h1>
        <p className="mt-7 max-w-2xl text-center text-lg leading-8 text-tertiary-foreground text-balance sm:text-xl">
          Bundle client-facing content into one sleek, trackable site.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-5 text-base">
            <a href="/auth?mode=sign-up">
              Start building free
              <IconArrowRight data-icon="inline-end" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 px-5 text-base">
            <a href="#how-it-works">
              See how it works
              <IconPlayerPlay data-icon="inline-end" />
            </a>
          </Button>
        </div>

        <div id="product" className="mt-16 w-full scroll-mt-28 sm:mt-20">
          <ul className="grid grid-cols-2 border-y border-border-subtle bg-background/70 md:grid-cols-4">
            {proofPoints.map((point) => (
              <li key={point} className="flex min-h-14 items-center justify-center gap-2 border-border-subtle px-3 text-center text-sm font-medium even:border-l md:border-l md:first:border-l-0">
                <span className="flex size-5 items-center justify-center rounded-full bg-green-background text-green-foreground">
                  <IconCheck className="size-3" aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <ProductPreview />
        </div>
      </div>
    </section>
  )
}

function ProductPreview() {
  return (
    <div className="relative border-x border-b border-border bg-muted p-3 shadow-[0_40px_120px_color-mix(in_oklab,var(--foreground)_12%,transparent)] sm:p-6 lg:p-10">
      <div className="absolute -right-2 top-8 z-20 hidden w-72 rounded-xl border border-border-strong bg-primary p-4 text-primary-foreground shadow-2xl sm:block lg:right-5 lg:top-20">
        <div className="flex items-start gap-3">
          <span className="mt-1 size-2 shrink-0 rounded-full bg-green-foreground shadow-[0_0_0_5px_var(--green-background)]" />
          <div>
            <p className="text-sm font-medium">Maya is viewing your Handout</p>
            <p className="mt-1 text-xs text-primary-foreground/60">Business case · just now</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-strong bg-background shadow-xl">
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-red-foreground/70" />
            <span className="size-2.5 rounded-full bg-yellow-foreground/70" />
            <span className="size-2.5 rounded-full bg-green-foreground/70" />
          </div>
          <div className="hidden min-w-0 items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <IconLink className="size-3.5" aria-hidden="true" />
            handout.link/acme/launch-plan
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-green-foreground" />
            Live
          </div>
        </div>

        <div className="grid min-h-[470px] lg:grid-cols-[220px_minmax(0,1fr)_260px]">
          <aside className="hidden border-r border-border bg-card p-4 lg:block">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">N</div>
              <div>
                <p className="text-sm font-medium">Northstar</p>
                <p className="text-xs text-muted-foreground">Renewal hub</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-1 text-sm">
              <div className="rounded-lg bg-accent px-3 py-2 font-medium">Overview</div>
              <div className="px-3 py-2 text-muted-foreground">Business case</div>
              <div className="px-3 py-2 text-muted-foreground">Security</div>
              <div className="px-3 py-2 text-muted-foreground">Implementation</div>
            </div>
          </aside>

          <div className="min-w-0 p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-foreground">
                <span className="size-2 rounded-full bg-blue-foreground" />
                Prepared for Acme
              </div>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.035em] sm:text-5xl">Your launch plan, all in one place.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-tertiary-foreground sm:text-base">
                Everything your team needs to align, decide, and move into implementation.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <PreviewResource icon={IconChartBar} title="ROI model" meta="Interactive sheet" />
                <PreviewResource icon={IconFileText} title="Security overview" meta="8 page brief" />
                <PreviewResource icon={IconClock} title="Launch timeline" meta="4 week plan" />
                <PreviewResource icon={IconMessageCircle} title="Next-step recap" meta="From your last call" />
              </div>

              <div className="mt-8 flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-medium">Ready to move forward?</p>
                  <p className="mt-1 text-xs text-muted-foreground">Choose the next step that works for you.</p>
                </div>
                <span className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Book kickoff</span>
              </div>
            </div>
          </div>

          <aside className="hidden border-l border-border bg-card p-4 xl:block">
            <p className="text-xs font-medium text-muted-foreground">Live activity</p>
            <div className="mt-4 flex flex-col gap-3">
              <ActivityItem icon={IconEye} title="Maya opened" detail="Business case · now" tone="green" />
              <ActivityItem icon={IconUsers} title="Shared internally" detail="2 new viewers · 9m" tone="blue" />
              <ActivityItem icon={IconClock} title="Returned to site" detail="Third visit · 1h" tone="purple" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function PreviewResource({
  icon: Icon,
  title,
  meta,
}: {
  icon: typeof IconFileText
  title: string
  meta: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-background text-blue-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  )
}

function ActivityItem({
  icon: Icon,
  title,
  detail,
  tone,
}: {
  icon: typeof IconEye
  title: string
  detail: string
  tone: "green" | "blue" | "purple"
}) {
  const toneClass = {
    green: "bg-green-background text-green-foreground",
    blue: "bg-blue-background text-blue-foreground",
    purple: "bg-purple-background text-purple-foreground",
  }[tone]

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className={`flex size-7 items-center justify-center rounded-lg ${toneClass}`}>
        <Icon className="size-3.5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function AudienceStrip() {
  return (
    <section aria-label="Teams that use Handout" className="border-b border-border-subtle px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">Built for client-facing teams</p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-tertiary-foreground sm:justify-end">
          <span>Sales</span>
          <span>Partnerships</span>
          <span>Client services</span>
          <span>Fundraising</span>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="How it works"
          title="From scattered follow-up to one clear next step."
          description="Handout gives every deal a polished destination—and gives you the context to follow up at the right moment."
        />
        <div className="mt-14 grid border-y border-border-subtle lg:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <article key={step.number} className="border-b border-border-subtle px-2 py-8 last:border-b-0 lg:border-r lg:border-b-0 lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{step.number}</span>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="mt-10 text-xl font-semibold tracking-[-0.025em]">{step.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-tertiary-foreground">{step.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function ProductStory() {
  return (
    <section className="bg-card px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">One link, built around the deal</p>
          <h2 className="mt-5 max-w-lg text-4xl leading-[1.02] font-semibold tracking-[-0.045em] text-balance sm:text-6xl">Give buyers a place worth returning to.</h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-tertiary-foreground">
            Stop asking prospects to dig through old threads. Keep the story, the proof, and the next step together in a site that stays current.
          </p>
          <ul className="mt-8 flex flex-col gap-4 text-sm">
            <CheckItem>Update content without resending the link</CheckItem>
            <CheckItem>Personalize the experience for every account</CheckItem>
            <CheckItem>Keep the buying team aligned in one place</CheckItem>
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border bg-background p-5 shadow-sm sm:translate-y-10">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Business case</span>
              <span>Updated now</span>
            </div>
            <div className="mt-16 rounded-2xl bg-primary p-5 text-primary-foreground">
              <p className="text-xs text-primary-foreground/60">Projected impact</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">18 hours</p>
              <p className="mt-1 text-sm text-primary-foreground/70">saved every week</p>
              <div className="mt-8 grid grid-cols-5 items-end gap-2" aria-hidden="true">
                {[32, 46, 41, 64, 82].map((height) => (
                  <span key={height} className="rounded-sm bg-primary-foreground/70" style={{ height }} />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Buyer checklist</span>
              <span>3 of 4</span>
            </div>
            <div className="mt-12 flex flex-col gap-3">
              {[
                ["Review success plan", true],
                ["Share security brief", true],
                ["Confirm launch team", true],
                ["Book kickoff", false],
              ].map(([label, done]) => (
                <div key={String(label)} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm">
                  <span className={`flex size-5 items-center justify-center rounded-full ${done ? "bg-green-background text-green-foreground" : "border border-border-strong text-transparent"}`}>
                    <IconCheck className="size-3" aria-hidden="true" />
                  </span>
                  <span className={done ? "text-tertiary-foreground" : "font-medium"}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrackingSection() {
  return (
    <section id="tracking" className="dark scroll-mt-20 bg-background px-5 py-24 text-foreground sm:px-8 sm:py-32 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <SectionIntro
            eyebrow="Tracking"
            title="Know when interest turns into intent."
            description="See the moments that matter without turning your workflow into a dashboard chore."
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SignalMetric value="Now" label="Live visit" />
            <SignalMetric value="3×" label="Return visits" />
            <SignalMetric value="4m 18s" label="Active time" />
            <SignalMetric value="+2" label="New viewers" />
          </div>
        </div>

        <div className="mt-16 overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-foreground shadow-[0_0_0_5px_var(--green-background)]" />
              <span className="text-sm font-medium">Acme activity</span>
            </div>
            <span className="text-xs text-muted-foreground">Live signal rail</span>
          </div>
          <div className="relative p-5 sm:p-8">
            <div aria-hidden="true" className="absolute top-1/2 right-8 left-8 h-px bg-border" />
            <div className="relative grid gap-4 md:grid-cols-3">
              <SignalCard icon={IconEye} time="09:42" title="Maya opened the site" detail="Viewed your launch plan" tone="green" />
              <SignalCard icon={IconFileText} time="09:46" title="Business case opened" detail="Active for 2m 31s" tone="blue" />
              <SignalCard icon={IconUsers} time="09:51" title="Shared with a teammate" detail="A new stakeholder joined" tone="purple" />
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <TrackingBenefit icon={IconEye} title="See real attention">Separate real engagement from a link that was merely opened.</TrackingBenefit>
          <TrackingBenefit icon={IconUsers} title="Spot the buying team">Know when new stakeholders enter the conversation.</TrackingBenefit>
          <TrackingBenefit icon={IconClock} title="Follow up with context">Reach out when the deal is active and know what to talk about.</TrackingBenefit>
        </div>
      </div>
    </section>
  )
}

function SignalMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-border pl-4">
      <p className="text-xl font-semibold tracking-[-0.03em]">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function SignalCard({
  icon: Icon,
  time,
  title,
  detail,
  tone,
}: {
  icon: typeof IconEye
  time: string
  title: string
  detail: string
  tone: "green" | "blue" | "purple"
}) {
  const toneClass = {
    green: "bg-green-background text-green-foreground",
    blue: "bg-blue-background text-blue-foreground",
    purple: "bg-purple-background text-purple-foreground",
  }[tone]

  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <span className={`flex size-8 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{time}</span>
      </div>
      <p className="mt-8 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

function TrackingBenefit({ icon: Icon, title, children }: { icon: typeof IconEye; title: string; children: string }) {
  return (
    <div>
      <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      <h3 className="mt-5 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  )
}

function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionIntro
          eyebrow="Pricing"
          title="Start with the deal in front of you."
          description="Create your first Handout for free. No card, no setup call, and no reason to keep sending attachment-heavy follow-ups."
        />

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm font-medium">Free to start</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-6xl font-semibold tracking-[-0.06em]">$0</span>
                <span className="pb-2 text-sm text-muted-foreground">to build your first site</span>
              </div>
            </div>
            <Button asChild size="lg" className="h-11 px-5">
              <a href="/auth?mode=sign-up">
                Start for free
                <IconArrowRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
          <Separator className="my-8" />
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <CheckItem>Build a polished one pager</CheckItem>
            <CheckItem>Share with one simple link</CheckItem>
            <CheckItem>Update content any time</CheckItem>
            <CheckItem>No credit card required</CheckItem>
          </div>
        </div>
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border-subtle bg-card px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.65fr_1fr]">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">FAQ</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em]">A few things buyers usually ask.</h2>
        </div>
        <Accordion type="single" collapsible>
          {faqItems.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger className="py-5 text-base">{item.question}</AccordionTrigger>
              <AccordionContent className="max-w-xl pb-5 leading-6 text-tertiary-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-10 sm:py-24">
        <p className="text-xs font-medium tracking-[0.18em] text-primary-foreground/60 uppercase">One link. One clear story.</p>
        <h2 className="mt-5 max-w-4xl text-4xl leading-[1] font-semibold tracking-[-0.05em] text-balance sm:text-7xl">Make the next follow-up the one they remember.</h2>
        <p className="mt-6 max-w-xl text-base leading-7 text-primary-foreground/65">Build a Handout in minutes and give your prospect a better way to say yes.</p>
        <Button asChild variant="secondary" size="lg" className="mt-9 h-11 px-5">
          <a href="/auth?mode=sign-up">
            Start building free
            <IconArrowRight data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </section>
  )
}

function MarketingFooter() {
  return (
    <footer className="border-t border-border-subtle px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <a href="#top" aria-label="Back to top" className="w-fit rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img src="/handout-logo.svg" alt="Handout" className="h-[18px] w-[90px]" />
        </a>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
          <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          <a href="/auth" className="transition-colors hover:text-foreground">Log in</a>
        </nav>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Handout</p>
      </div>
    </footer>
  )
}

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p>
      <h2 className="mt-5 max-w-3xl text-4xl leading-[1.02] font-semibold tracking-[-0.045em] text-balance sm:text-6xl">{title}</h2>
      <p className="mt-6 max-w-2xl text-base leading-7 text-tertiary-foreground">{description}</p>
    </div>
  )
}

function CheckItem({ children }: { children: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-background text-green-foreground">
        <IconCheck className="size-3" aria-hidden="true" />
      </span>
      <span>{children}</span>
    </li>
  )
}
