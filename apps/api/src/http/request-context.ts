import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export type RequestContext = {
  requestId: string;
  startedAt: Date;
};

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}

export function requestContextMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const incomingRequestId = request.header("x-request-id")?.trim();
  const requestId = incomingRequestId || randomUUID();

  request.context = {
    requestId,
    startedAt: new Date(),
  };

  response.setHeader("x-request-id", requestId);
  next();
}
