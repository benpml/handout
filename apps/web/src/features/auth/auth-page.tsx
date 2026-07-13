import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { LIGHTSITE_TEXT_LIMITS, normalizeEmail, validateWorkEmail } from "@lightsite/domain"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { queryKeys } from "@/lib/api/query-keys"
import {
  enableDevAuthBypass,
  isDevAuthBypassAvailable,
} from "@/lib/api/dev-auth-bypass"
import { cn } from "@/lib/utils"

import { authClient } from "./auth-client"

type AuthMode = "sign-in" | "sign-up"

export function AuthPage() {
  const returnTo = useMemo(() => getSafeExtensionReturnTo(), [])
  const initialMode = useMemo<AuthMode>(() => {
    const mode = new URLSearchParams(window.location.search).get("mode")
    return mode === "sign-up" ? "sign-up" : "sign-in"
  }, [])
  const [mode, setMode] = useState<AuthMode>(initialMode)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 text-foreground md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <img src="/lightsite-logo.svg" alt="Lightsite" className="h-[17px] w-[83px]" />
        </Link>
        <LoginForm mode={mode} onModeChange={setMode} returnTo={returnTo} />
      </div>
    </div>
  )
}

function LoginForm({
  className,
  mode,
  onModeChange,
  returnTo,
  ...props
}: {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  returnTo: string | null
} & React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedEmail = normalizeEmail(email)
  const emailValidation = validateWorkEmail(email)
  const passwordIsValid = password.length >= 8
  const canSubmit = emailValidation.ok && passwordIsValid && !isSubmitting

  const switchMode = (nextMode: AuthMode) => {
    onModeChange(nextMode)
    setSubmitError(null)
    const params = new URLSearchParams()
    if (nextMode === "sign-up") params.set("mode", "sign-up")
    if (returnTo) params.set("returnTo", returnTo)
    window.history.replaceState(null, "", `/auth${params.size ? `?${params}` : ""}`)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)

    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({
              name: getInitialAccountName(normalizedEmail),
              email: normalizedEmail,
              password,
            })
          : await authClient.signIn.email({
              email: normalizedEmail,
              password,
            })

      if (result.error) {
        throw new Error(getBetterAuthErrorMessage(result.error, mode))
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.me() })
      if (returnTo) {
        window.location.replace(returnTo)
      } else {
        await navigate({ to: "/onboarding" })
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Try again in a moment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const continueLocally = async () => {
    enableDevAuthBypass()
    await queryClient.invalidateQueries({ queryKey: queryKeys.me() })
    if (returnTo) {
      window.location.replace(returnTo)
    } else {
      await navigate({ to: "/sites" })
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {mode === "sign-up" ? "Create your account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {mode === "sign-up"
              ? "Create your account with your work email"
              : "Log in with your work email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field data-invalid={!emailValidation.ok && email.length > 0 ? true : undefined}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  maxLength={LIGHTSITE_TEXT_LIMITS.email}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setSubmitError(null)
                  }}
                  autoComplete="email"
                  placeholder="m@example.com"
                  required
                  aria-invalid={!emailValidation.ok && email.length > 0 ? true : undefined}
                  disabled={isSubmitting}
                />
                {!emailValidation.ok && email.length > 0 ? (
                  <FieldError>{emailValidation.message}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={!passwordIsValid && password.length > 0 ? true : undefined}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  maxLength={LIGHTSITE_TEXT_LIMITS.password}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setSubmitError(null)
                  }}
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  required
                  aria-invalid={!passwordIsValid && password.length > 0 ? true : undefined}
                  disabled={isSubmitting}
                />
                {!passwordIsValid && password.length > 0 ? (
                  <FieldError>Use at least 8 characters.</FieldError>
                ) : null}
              </Field>
              <AuthErrorAlert mode={mode} submitError={submitError} />
              {isDevAuthBypassAvailable() ? (
                <Field>
                  <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                    Local development
                  </FieldSeparator>
                  <Button variant="secondary" type="button" onClick={() => void continueLocally()}>
                    Continue locally
                  </Button>
                </Field>
              ) : null}
              <Field data-disabled={!canSubmit ? true : undefined}>
                <Button type="submit" disabled={!canSubmit}>
                  {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                  {mode === "sign-up" ? "Create account" : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  {mode === "sign-up" ? "Already have an account?" : "Don't have an account?"}{" "}
                  <a
                    href={buildAuthModeHref(mode === "sign-up" ? "sign-in" : "sign-up", returnTo)}
                    onClick={(event) => {
                      event.preventDefault()
                      switchMode(mode === "sign-up" ? "sign-in" : "sign-up")
                    }}
                  >
                    {mode === "sign-up" ? "Sign in" : "Sign up"}
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Use your company email to create and manage your Lightsite account.
      </FieldDescription>
    </div>
  )
}

function AuthErrorAlert({
  mode,
  submitError,
}: {
  mode: AuthMode
  submitError: string | null
}) {
  if (!submitError) {
    return null
  }

  return (
    <Field>
      <Alert variant="destructive">
        <AlertTitle>{mode === "sign-up" ? "Account was not created" : "Login failed"}</AlertTitle>
        <AlertDescription>{submitError}</AlertDescription>
      </Alert>
    </Field>
  )
}

function getInitialAccountName(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Lightsite user"
}

function getSafeExtensionReturnTo() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo")
  if (!returnTo) return null
  try {
    const url = new URL(returnTo, window.location.origin)
    if (url.origin !== window.location.origin || url.pathname !== "/extension-connect") {
      return null
    }
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

function buildAuthModeHref(mode: AuthMode, returnTo: string | null) {
  const params = new URLSearchParams()
  if (mode === "sign-up") params.set("mode", "sign-up")
  if (returnTo) params.set("returnTo", returnTo)
  return `/auth${params.size ? `?${params}` : ""}`
}

function getBetterAuthErrorMessage(
  error: { message?: string; code?: string; status?: number },
  mode: AuthMode,
) {
  if (error.code === "email.personal_domain_blocked") {
    return "Use your company email to sign up for Lightsite."
  }

  if (error.code === "email.plus_addressing_blocked") {
    return "Use your work email without a plus alias."
  }

  if (error.message) {
    return error.message
  }

  return mode === "sign-up" ? "Create account failed." : "Check your email and password."
}
