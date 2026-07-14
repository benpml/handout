import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";

export type TrackingV2RecordingObject = {
  body: Buffer;
  contentType: string;
  contentEncoding: "gzip" | null;
};

export interface TrackingV2RecordingObjectStore {
  putObject(input: {
    key: string;
    body: Buffer;
    contentType: string;
    contentEncoding: "gzip" | null;
  }): Promise<void>;
  getObject(key: string): Promise<TrackingV2RecordingObject | null>;
  deleteObject(key: string): Promise<void>;
}

export function createMemoryTrackingV2RecordingObjectStore(): TrackingV2RecordingObjectStore & {
  objects: Map<string, TrackingV2RecordingObject>;
} {
  const objects = new Map<string, TrackingV2RecordingObject>();
  return {
    objects,
    async putObject(input) {
      objects.set(input.key, {
        body: Buffer.from(input.body),
        contentType: input.contentType,
        contentEncoding: input.contentEncoding,
      });
    },
    async getObject(key) {
      const object = objects.get(key);
      return object ? { ...object, body: Buffer.from(object.body) } : null;
    },
    async deleteObject(key) {
      objects.delete(key);
    },
  };
}

export function createFileTrackingV2RecordingObjectStore(rootDirectory: string): TrackingV2RecordingObjectStore {
  const root = path.resolve(rootDirectory);
  return {
    async putObject(input) {
      const objectPath = resolveObjectPath(root, input.key);
      await mkdir(path.dirname(objectPath), { recursive: true });
      await writeFile(objectPath, input.body, { flag: "wx" }).catch(async (error: unknown) => {
        if (!isNodeError(error) || error.code !== "EEXIST") throw error;
        const existing = await readFile(objectPath);
        if (!existing.equals(input.body)) throw new Error("Recording object key already contains different data.");
      });
    },
    async getObject(key) {
      try {
        const body = await readFile(resolveObjectPath(root, key));
        return {
          body,
          contentType: "application/json; charset=utf-8",
          contentEncoding: isGzip(body) ? "gzip" : null,
        };
      } catch (error) {
        if (isNodeError(error) && error.code === "ENOENT") return null;
        throw error;
      }
    },
    async deleteObject(key) {
      try {
        await unlink(resolveObjectPath(root, key));
      } catch (error) {
        if (isNodeError(error) && error.code === "ENOENT") return;
        throw error;
      }
    },
  };
}

export function createS3TrackingV2RecordingObjectStore(input: {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
  keyPrefix?: string;
}): TrackingV2RecordingObjectStore {
  const credentials = input.accessKeyId && input.secretAccessKey
    ? { accessKeyId: input.accessKeyId, secretAccessKey: input.secretAccessKey }
    : undefined;
  const config: S3ClientConfig = {
    region: input.region,
    ...(input.endpoint ? { endpoint: input.endpoint } : {}),
    ...(credentials ? { credentials } : {}),
    ...(input.forcePathStyle === undefined ? {} : { forcePathStyle: input.forcePathStyle }),
  };
  const client = new S3Client(config);
  const prefix = normalizeKeyPrefix(input.keyPrefix);
  const key = (value: string) => `${prefix}${validateObjectKey(value)}`;

  return {
    async putObject(object) {
      await client.send(new PutObjectCommand({
        Bucket: input.bucket,
        Key: key(object.key),
        Body: object.body,
        ContentType: object.contentType,
        ...(object.contentEncoding ? { ContentEncoding: object.contentEncoding } : {}),
        CacheControl: "private, no-store",
      }));
    },
    async getObject(objectKey) {
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: input.bucket, Key: key(objectKey) }));
        if (!result.Body) return null;
        return {
          body: Buffer.from(await result.Body.transformToByteArray()),
          contentType: result.ContentType ?? "application/json; charset=utf-8",
          contentEncoding: result.ContentEncoding === "gzip" ? "gzip" : null,
        };
      } catch (error) {
        if (isMissingS3Object(error)) return null;
        throw error;
      }
    },
    async deleteObject(objectKey) {
      await client.send(new DeleteObjectCommand({ Bucket: input.bucket, Key: key(objectKey) }));
    },
  };
}

function normalizeKeyPrefix(value: string | undefined) {
  const normalized = value?.split("/").filter(Boolean).join("/") ?? "";
  return normalized ? `${normalized}/` : "";
}

function validateObjectKey(value: string) {
  const parts = value.split("/");
  if (parts.length === 0 || parts.some((part) => !part || part === "." || part === "..")) {
    throw new Error("Invalid recording object key.");
  }
  return parts.join("/");
}

function resolveObjectPath(root: string, key: string) {
  const resolved = path.resolve(root, ...validateObjectKey(key).split("/"));
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error("Recording object key escapes storage root.");
  return resolved;
}

function isGzip(body: Buffer) {
  return body.length >= 2 && body[0] === 0x1f && body[1] === 0x8b;
}

function isMissingS3Object(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: unknown; $metadata?: { httpStatusCode?: unknown } };
  return candidate.name === "NoSuchKey" || candidate.$metadata?.httpStatusCode === 404;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
