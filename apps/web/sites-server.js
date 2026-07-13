const API_ORIGIN = "https://lightsite-api.onrender.com"
const TRUSTED_WEB_ORIGIN = "https://lightsite-bfi.pages.dev"

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith("/api/")) {
      return proxyApiRequest(request, url)
    }

    const assetResponse = await env.ASSETS.fetch(request)
    if (assetResponse.status !== 404 || request.method !== "GET") {
      return assetResponse
    }

    const acceptsHtml = request.headers.get("accept")?.includes("text/html")
    if (!acceptsHtml) {
      return assetResponse
    }

    const indexUrl = new URL("/index.html", url)
    return env.ASSETS.fetch(new Request(indexUrl, request))
  },
}

function proxyApiRequest(request, requestUrl) {
  const upstreamUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, API_ORIGIN)
  const headers = new Headers(request.headers)
  headers.set("origin", TRUSTED_WEB_ORIGIN)
  headers.set("x-forwarded-host", new URL(TRUSTED_WEB_ORIGIN).host)
  headers.set("x-forwarded-proto", "https")

  return fetch(
    new Request(upstreamUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    }),
  )
}
