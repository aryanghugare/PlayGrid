const base = "/api/v1";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
let refreshing: Promise<boolean> | null = null;
async function refresh() {
  if (!refreshing)
    refreshing = fetch(`${base}/users/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  return refreshing;
}
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
  retry = true
): Promise<T> {
  const multipart = options.body instanceof FormData;
  const response = await fetch(base + path, {
    method: options.method || "GET",
    credentials: "include",
    signal: options.signal,
    headers:
      options.body && !multipart
        ? { "Content-Type": "application/json" }
        : undefined,
    body: options.body
      ? multipart
        ? (options.body as FormData)
        : JSON.stringify(options.body)
      : undefined,
  });
  if (
    response.status === 401 &&
    retry &&
    ![
      "/users/login",
      "/users/register",
      "/users/refresh-token",
      "/users/logout",
    ].includes(path) &&
    (await refresh())
  )
    return api<T>(path, options, false);
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      body?.message || "Could not reach PlayGrid. Please try again.",
      response.status
    );
  return body.data as T;
}
export function upload<T>(
  path: string,
  data: FormData,
  onProgress: (percent: number) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", base + path);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () =>
      reject(
        new ApiError("Upload interrupted. Check your connection and retry.", 0)
      );
    xhr.onload = () => {
      let body;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new ApiError("Unexpected upload response", xhr.status));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body.data);
      else reject(new ApiError(body.message || "Upload failed", xhr.status));
    };
    xhr.send(data);
  });
}
