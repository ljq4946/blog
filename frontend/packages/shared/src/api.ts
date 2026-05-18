export interface ApiClientOptions {
  baseUrl?: string;
  getToken?: () => string | null;
  fetcher?: typeof fetch;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getToken?: () => string | null;
  private readonly fetcher: typeof fetch;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "/api";
    this.getToken = options.getToken;
    this.fetcher = options.fetcher ?? fetch.bind(globalThis);
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "POST", body: body == null ? undefined : JSON.stringify(body) });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PUT", body: body == null ? undefined : JSON.stringify(body) });
  }

  delete(path: string) {
    return this.request<void>(path, { method: "DELETE" });
  }

  upload<T>(path: string, formData: FormData) {
    return this.request<T>(path, { method: "POST", body: formData }, false);
  }

  async request<T>(path: string, init: RequestInit = {}, json = true): Promise<T> {
    const headers = new Headers(init.headers);
    if (json && init.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    const token = this.getToken?.();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await this.fetcher(joinUrl(this.baseUrl, path), { ...init, headers });
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return response.json() as Promise<T>;
  }
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message || `Request failed with ${status}`);
  }
}

export function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
