import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_CLINIC_BACKEND_URL?.trim() ?? process.env.CLINIC_BACKEND_URL?.trim() ?? "";

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const normalizePath = (path: string): string => {
  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
};

const readCookieHeader = (): string => {
  try {
    const allCookies = cookies().getAll();
    return allCookies.map((entry) => `${entry.name}=${entry.value}`).join("; ");
  } catch {
    return "";
  }
};

const readRequestCookieHeader = (request: Request | NextRequest): string => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (cookieHeader.length > 0) {
    return cookieHeader;
  }

  if ("cookies" in request && typeof request.cookies?.getAll === "function") {
    return request.cookies
      .getAll()
      .map((entry) => `${entry.name}=${entry.value}`)
      .join("; ");
  }

  return "";
};

const isBodylessMethod = (method: string): boolean => {
  return method === "GET" || method === "HEAD";
};

const rewriteSetCookieHeader = (value: string): string => {
  return value
    .replace(/;\s*secure/gi, "")
    .replace(/;\s*domain=[^;]+/gi, "");
};

const backendEndpoint = (path: string): string => {
  if (BACKEND_URL.length === 0) {
    throw new Error("CLINIC_BACKEND_URL is not configured.");
  }

  return new URL(normalizePath(path), BACKEND_URL).toString();
};

export const isBackendProxyMode = (): boolean => BACKEND_URL.length > 0;

export const getBackendBaseUrl = (): string => BACKEND_URL;

export const backendPath = (path: string): string => normalizePath(path);

export const backendFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  const cookieHeader = readCookieHeader();

  if (cookieHeader.length > 0 && !headers.has("cookie")) {
    headers.set("cookie", cookieHeader);
  }

  return fetch(backendEndpoint(path), {
    ...init,
    cache: "no-store",
    headers,
  });
};

export const backendJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await backendFetch(path, init);
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Backend request failed (${response.status} ${response.statusText}) ${errorText}`.trim(),
    );
  }

  return (await response.json()) as T;
};

export const backendJsonOrNull = async <T>(path: string, init: RequestInit = {}): Promise<T | null> => {
  const response = await backendFetch(path, init);
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Backend request failed (${response.status} ${response.statusText}) ${errorText}`.trim(),
    );
  }

  return (await response.json()) as T;
};

export const proxyRequestToBackend = async (
  request: Request | NextRequest,
  backendPath?: string,
): Promise<Response> => {
  const resolvedBackendPath =
    backendPath ?? ("nextUrl" in request ? `${request.nextUrl.pathname}${request.nextUrl.search}` : undefined);

  if (!resolvedBackendPath) {
    throw new Error("Backend path is required when proxying a plain Request.");
  }

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase()) && key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });

  const cookieHeader = readRequestCookieHeader(request);
  if (cookieHeader.length > 0) {
    headers.set("cookie", cookieHeader);
  }

  const body = isBodylessMethod(request.method) ? undefined : await request.arrayBuffer();
  const response = await fetch(backendEndpoint(resolvedBackendPath), {
    method: request.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase()) && key.toLowerCase() !== "set-cookie") {
      responseHeaders.set(key, value);
    }
  });

  const setCookieHeaders = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
  if (setCookieHeaders.length > 0) {
    for (const headerValue of setCookieHeaders) {
      responseHeaders.append("set-cookie", rewriteSetCookieHeader(headerValue));
    }
  } else {
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      responseHeaders.set("set-cookie", rewriteSetCookieHeader(setCookieHeader));
    }
  }

  return new Response(isBodylessMethod(request.method) ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};
