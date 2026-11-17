// One place for every request to the API.
// Success: returns the parsed body, typed as T.
// Failure: throws an ApiError with the details from
// { error: { code, message, fields } } (docs/api.md).

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const init: RequestInit = { method: options.method ?? "GET" };
  if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    // No response at all: server down, no internet
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Could not reach the server. Try again.",
    );
  }

  // 204 No Content (DELETE) has no body to parse
  if (res.status === 204) return undefined as T;

  // The body might not be JSON (for example a proxy error page)
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = data?.error;
    throw new ApiError(
      res.status,
      error?.code ?? "UNKNOWN_ERROR",
      error?.message ?? "Could not reach the server. Try again.",
      error?.fields,
    );
  }

  return data as T;
}
