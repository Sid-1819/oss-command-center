import { readFileSync } from "node:fs";
import type { ConnectionOptions } from "node:tls";
import awsCaBundle from "aws-ssl-profiles";

const PG_SSL_QUERY_PARAMS = [
  "sslmode",
  "ssl",
  "sslrootcert",
  "sslcert",
  "sslkey",
  "sslcrl",
  "sslpassword",
] as const;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function requiresSsl(connectionString?: string): boolean {
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  if (!connectionString) {
    return false;
  }

  return /sslmode=(require|verify-full|verify-ca)/i.test(connectionString);
}

export function getPgSslConfig(connectionString?: string): ConnectionOptions | undefined {
  if (!requiresSsl(connectionString)) {
    return undefined;
  }

  const customCaPath = process.env.DATABASE_SSL_CA_PATH?.trim();
  if (customCaPath) {
    return {
      rejectUnauthorized: true,
      ca: readFileSync(customCaPath, "utf8"),
    };
  }

  return {
    rejectUnauthorized: true,
    ca: awsCaBundle.ca,
  };
}

function stripPgSslQueryParams(connectionString: string): string {
  const url = new URL(connectionString);

  for (const param of PG_SSL_QUERY_PARAMS) {
    url.searchParams.delete(param);
  }

  return url.toString();
}

export function getPgPoolConfig(connectionString?: string): {
  connectionString?: string;
  ssl?: ConnectionOptions;
} {
  if (!connectionString) {
    return { connectionString };
  }

  const ssl = getPgSslConfig(connectionString);
  if (!ssl) {
    return { connectionString };
  }

  // pg v8 treats sslmode=require in the URL as verify-full and ignores the ssl
  // object. Strip URL SSL params so our CA bundle is used instead.
  return {
    connectionString: stripPgSslQueryParams(connectionString),
    ssl,
  };
}
