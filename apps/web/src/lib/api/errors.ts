import type { ApiErrorIssue } from "@handout/contracts"

export class ApiClientError extends Error {
  readonly code: string
  readonly status: number
  readonly requestId: string | null
  readonly issues: ApiErrorIssue[]

  constructor(input: {
    code: string
    message: string
    status: number
    requestId?: string | null
    issues?: ApiErrorIssue[]
  }) {
    super(input.message)
    this.name = "ApiClientError"
    this.code = input.code
    this.status = input.status
    this.requestId = input.requestId ?? null
    this.issues = input.issues ?? []
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (isApiClientError(error)) {
    return error.message
  }

  return fallback
}

export function getApiFieldError(error: unknown, fieldName: string) {
  if (!isApiClientError(error)) {
    return null
  }

  const issue = error.issues.find((candidate) => candidate.path[0] === fieldName)
  return issue?.message ?? null
}

export function createApiClientErrorFromResponse(input: {
  status: number
  body: unknown
  requestId: string | null
}) {
  const parsed = parseApiErrorResponse(input.body)

  if (parsed) {
    return new ApiClientError({
      code: parsed.error.code,
      message: parsed.error.message,
      status: input.status,
      requestId: parsed.error.requestId,
      issues: parsed.error.issues,
    })
  }

  return new ApiClientError({
    code: "request.failed",
    message: "The request failed.",
    status: input.status,
    requestId: input.requestId,
  })
}

function parseApiErrorResponse(value: unknown) {
  const body = asRecordOrNull(value)
  const error = asRecordOrNull(body?.error)

  if (
    !error ||
    typeof error.code !== "string" ||
    typeof error.message !== "string" ||
    typeof error.requestId !== "string"
  ) {
    return null
  }

  return {
    error: {
      code: error.code,
      message: error.message,
      requestId: error.requestId,
      issues: parseApiErrorIssues(error.issues),
    },
  }
}

function parseApiErrorIssues(value: unknown): ApiErrorIssue[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((issue) => {
    const object = asRecordOrNull(issue)

    if (!object || !Array.isArray(object.path) || typeof object.message !== "string") {
      return []
    }

    const path = object.path.filter((segment): segment is string | number => (
      typeof segment === "string" || typeof segment === "number"
    ))

    return [{ path, message: object.message }]
  })
}

function asRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}
