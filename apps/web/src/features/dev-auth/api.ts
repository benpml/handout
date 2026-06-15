import { appBootstrapResponseSchema } from "@/features/app-bootstrap/api"
import { apiRequest } from "@/lib/api/client"
import { enableDevAuthBypass } from "@/lib/api/dev-auth-bypass"

export async function enableAndProvisionDevAuthBypass(signal?: AbortSignal) {
  enableDevAuthBypass()

  return apiRequest("/api/dev/auth-bypass", {
    method: "POST",
    responseSchema: appBootstrapResponseSchema,
    signal,
  })
}
