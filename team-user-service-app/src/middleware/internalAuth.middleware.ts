import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Internal Secret Configuration
 * Example ENV format:
 * INTERNAL_SERVICE_SECRETS=v1:abc123,v2:xyz789,v3:rotatingKey987
 */
const INTERNAL_SECRETS_MAP: Record<string, string> = {};

const rawSecrets =
  process.env.INTERNAL_SERVICE_SECRETS ||
  process.env.INTERNAL_SERVICE_SECRET || // backward compatibility
  "";

rawSecrets
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)
  .forEach((entry) => {
    // Each entry should be in the format: version:secret
    const [version, secret] = entry.split(":");
    if (!version || !secret) {
      console.warn(`Skipping invalid secret format: '${entry}'`);
      return;
    }
    INTERNAL_SECRETS_MAP[version.trim()] = secret.trim();
  });

if (Object.keys(INTERNAL_SECRETS_MAP).length === 0) {
  throw new Error(
    " No valid INTERNAL_SERVICE_SECRETS defined. Use format: v1:abc123,v2:xyz789"
  );
}

/*
 Middleware: Verify request using secret version + timing-safe comparison
 */
export const verifyInternalSecret = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  try {
    const secretHeader = req.headers["x-internal-secret"];
    const versionHeader = req.headers["x-internal-secret-version"];

    const providedSecret =
      typeof secretHeader === "string"
        ? secretHeader
        : Array.isArray(secretHeader)
        ? secretHeader[0]
        : "";

    const providedVersion =
      typeof versionHeader === "string"
        ? versionHeader
        : Array.isArray(versionHeader)
        ? versionHeader[0]
        : "";

    // Validate headers
    if (!providedSecret) {
      return res
        .status(400)
        .json({ message: "Missing 'x-internal-secret' header." });
    }

    if (!providedVersion) {
      return res
        .status(400)
        .json({ message: "Missing 'x-internal-secret-version' header." });
    }

    const expectedSecret = INTERNAL_SECRETS_MAP[providedVersion];

    if (!expectedSecret) {
      console.warn(
        `[Security] Invalid secret version '${providedVersion}' from ${req.ip}`
      );
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid secret version." });
    }

    const providedBuffer = Buffer.from(providedSecret);
    const expectedBuffer = Buffer.from(expectedSecret);

    const isValid =
      providedBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(providedBuffer, expectedBuffer);

    if (!isValid) {
      console.warn(
        `[Security] Invalid secret for version '${providedVersion}' from ${req.ip}`
      );
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid internal secret." });
    }

    // Attach version info for downstream middleware if needed
    (req as any).internalSecretVersion = providedVersion;

    next();
  } catch (error) {
    console.error("Error verifying internal secret:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
