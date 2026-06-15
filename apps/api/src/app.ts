import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { getCurrentActor, type CurrentActorProvider } from "./auth/current-actor";
import { devActor, devWorkspace } from "./auth/dev-auth";
import { createDevAuthRouter } from "./auth/dev-auth-router";
import { createDbBootstrapRepository } from "./bootstrap/repository";
import { createBootstrapService, type BootstrapService } from "./bootstrap/service";
import { env } from "./env";
import { errorMiddleware, notFoundMiddleware } from "./http/error-middleware";
import { requestContextMiddleware } from "./http/request-context";
import { createMeRouter } from "./me/router";
import { createPublicSiteDocumentRouter } from "./public-sites/document-router";
import { createPublicSiteRouter } from "./public-sites/router";
import { createDbPublicSiteRepository } from "./public-sites/repository";
import {
  createPublicSiteService,
  type PublicSiteService,
} from "./public-sites/service";
import {
  buildMemorySite,
  createDbSiteRepository,
  createMemorySiteRepository,
} from "./sites/repository";
import { createSiteRouter } from "./sites/router";
import { createSiteService, type SiteService } from "./sites/service";
import {
  createHmacTrackingContextTokenService,
  type TrackingContextTokenService,
} from "./tracking/context-token";
import {
  createNoopTrackingEventSink,
  type TrackingEventSink,
} from "./tracking/event-sink";
import { createPublicTrackingScriptRouter } from "./tracking/public-script";
import {
  createMemoryTrackingRateLimiter,
  type TrackingRateLimiter,
} from "./tracking/rate-limit";
import { createTrackingRouter } from "./tracking/router";
import { createLogoDevPreviewService, type WorkspaceLogoPreviewService } from "./workspaces/logo-preview";
import { createDbWorkspaceRepository } from "./workspaces/repository";
import { createWorkspaceRouter } from "./workspaces/router";
import { createWorkspaceService, type WorkspaceService } from "./workspaces/service";

export type AppServices = {
  bootstrap: BootstrapService;
  logoPreview: WorkspaceLogoPreviewService;
  publicSites: PublicSiteService;
  sites: SiteService;
  trackingContextTokens: TrackingContextTokenService;
  trackingEvents: TrackingEventSink;
  trackingRateLimiter: TrackingRateLimiter;
  workspaces: WorkspaceService;
  getCurrentActor: CurrentActorProvider;
};

export type CreateAppOptions = Partial<AppServices> & {
  publicSiteOrigin?: string;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  app.disable("x-powered-by");

  const bootstrap =
    options.bootstrap ?? createBootstrapService(createDbBootstrapRepository());
  const logoPreview =
    options.logoPreview ?? createLogoDevPreviewService(env.LOGO_DEV_TOKEN);
  const trackingContextTokens =
    options.trackingContextTokens ??
    createHmacTrackingContextTokenService(env.TRACKING_SIGNING_SECRET);
  const trackingEvents =
    options.trackingEvents ?? createNoopTrackingEventSink();
  const publicSites =
    options.publicSites ??
    createPublicSiteService(createDbPublicSiteRepository(), {
      trackingContextTokens,
    });
  const publicSiteOrigin =
    options.publicSiteOrigin ?? env.PUBLIC_SITE_ORIGIN ?? env.WEB_ORIGIN;
  const sites =
    options.sites ?? createSiteService(createDbSiteRepository());
  const devSites = createSiteService(createMemorySiteRepository([
    buildMemorySite({
      id: "00000000-0000-4000-8000-000000000201",
      workspaceId: devWorkspace.id,
      createdByUserId: devActor.userId,
      updatedByUserId: devActor.userId,
      name: "Acme rollout brief",
      slug: "acme-rollout",
      status: "draft",
      visibility: "team",
    }),
  ]));
  const trackingRateLimiter =
    options.trackingRateLimiter ?? createMemoryTrackingRateLimiter();
  const workspaces =
    options.workspaces ?? createWorkspaceService(createDbWorkspaceRepository());
  const actorProvider = options.getCurrentActor ?? getCurrentActor;

  app.use(
    cors({
      origin: env.WEB_ORIGIN,
      credentials: true,
    }),
  );

  app.all("/api/auth/*", toNodeHandler(auth));

  app.use(requestContextMiddleware);
  app.use(express.json());

  app.get("/api/health", (request, response) => {
    response.json({
      ok: true,
      service: "lightsite-api",
      requestId: request.context.requestId,
    });
  });

  app.use("/api/dev", createDevAuthRouter());
  app.use(
    "/api/me",
    createMeRouter({
      bootstrapService: bootstrap,
      getCurrentActor: actorProvider,
    }),
  );
  app.use(
    "/api/sites",
    createSiteRouter({
      bootstrapService: bootstrap,
      devSiteService: devSites,
      getCurrentActor: actorProvider,
      siteService: sites,
    }),
  );
  app.use("/api/public/sites", createPublicSiteRouter({ publicSiteService: publicSites }));
  app.use(createTrackingRouter({
    contextTokens: trackingContextTokens,
    eventSink: trackingEvents,
    rateLimiter: trackingRateLimiter,
  }));
  app.use(createPublicTrackingScriptRouter());
  app.use(
    "/api/workspaces",
    createWorkspaceRouter({
      logoPreviewService: logoPreview,
      workspaceService: workspaces,
      getCurrentActor: actorProvider,
    }),
  );
  app.use(createPublicSiteDocumentRouter({
    publicSiteOrigin,
    publicSiteService: publicSites,
    trackingEvents,
    trackingRateLimiter,
  }));

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
