import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@lyeve-labs/client";
import { CmsProvider, useQuery, useMutation } from "../src/index.js";

// Need React for hooks testing
import { createElement, type ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";

function wrapper(config: { baseUrl?: string } = {}) {
  return ({ children }: { children: ReactNode }) =>
    createElement(
      CmsProvider,
      { config: { baseUrl: config.baseUrl ?? "http://localhost:3001" } },
      children,
    );
}

describe("CmsProvider", () => {
  it("provides context to children", () => {
    const { result } = renderHook(() => useQuery((c) => c.get("/test")), {
      wrapper: wrapper(),
    });
    expect(result.current).toBeDefined();
  });
});

describe("useQuery", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (_url: string, _init?: RequestInit) =>
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => useQuery((c) => c.get("/test")), {
      wrapper: wrapper(),
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("resolves data after fetch", async () => {
    const { result } = renderHook(
      () => useQuery((c) => c.get<{ ok: boolean }>("/test")),
      { wrapper: wrapper() },
    );
    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ ok: true });
    expect(result.current.error).toBeNull();
  });

  it("catches errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: "not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
          }),
      ),
    );
    const { result } = renderHook(() => useQuery((c) => c.get("/missing")), {
      wrapper: wrapper(),
    });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.data).toBeNull();
  });

  it("refetch triggers a new request", async () => {
    let count = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        count++;
        return new Response(JSON.stringify({ count }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }),
    );
    const { result } = renderHook(
      () => useQuery((c) => c.get<{ count: number }>("/test"), []),
      { wrapper: wrapper() },
    );
    await vi.waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ count: 1 });

    await act(() => {
      result.current.refetch();
    });
    await vi.waitFor(() => expect(result.current.data).toEqual({ count: 2 }));
  });

  it("throws without CmsProvider", () => {
    expect(() => renderHook(() => useQuery((c) => c.get("/test")))).toThrow(
      "CmsProvider must wrap your component tree",
    );
  });
});

describe("useMutation", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        const body = JSON.parse((init as RequestInit).body as string);
        return new Response(JSON.stringify({ id: "new-1", ...body }), {
          status: 201,
          headers: { "content-type": "application/json" },
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts not loading", () => {
    const { result } = renderHook(
      () =>
        useMutation((c, v: { name: string }) =>
          c.post<{ id: string }>("/items", v),
        ),
      { wrapper: wrapper() },
    );
    const [mutate, state] = result.current;
    expect(typeof mutate).toBe("function");
    expect(state.loading).toBe(false);
  });

  it("returns result after mutation", async () => {
    const { result } = renderHook(
      () =>
        useMutation((c, v: { name: string }) =>
          c.post<{ id: string }>("/items", v),
        ),
      { wrapper: wrapper() },
    );
    let data: { id: string } | null = null;
    await act(async () => {
      data = await result.current[0]({ name: "test" });
    });
    expect(data).toEqual({ id: "new-1", name: "test" });
  });
});
