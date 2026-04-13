export const json = (data: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: (() => {
      const headers = new Headers(init.headers);
      headers.set("Content-Type", "application/json; charset=utf-8");
      return headers;
    })(),
  });

export const badRequest = (message: string, extra?: Record<string, unknown>): Response =>
  json({ error: message, ...(extra || {}) }, { status: 400 });

export const unauthorized = (message = "Unauthorized"): Response => json({ error: message }, { status: 401 });

export const notFound = (message = "Not found"): Response => json({ error: message }, { status: 404 });

export const serverError = (message = "Internal server error"): Response => json({ error: message }, { status: 500 });
