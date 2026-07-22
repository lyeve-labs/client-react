/**
 * LyEve CMS React hooks - typed, reactive data fetching.
 *
 * Thin wrapper around {@link @lyeve/cms-client} that makes the client
 * available via context and provides `useQuery` / `useMutation` hooks.
 *
 * @example
 * ```tsx
 * import { CmsProvider, useQuery } from '@lyeve/cms-client-react';
 * import { getSchemas } from '@lyeve/cms-client-rest';
 *
 * function App() {
 *   return (
 *     <CmsProvider config={{ baseUrl: 'https://cms.example.com', getHeaders: () => ({ Authorization: `Bearer ${token}` }) }}>
 *       <SchemaManager />
 *     </CmsProvider>
 *   );
 * }
 *
 * function SchemaManager() {
 *   const { data: schemas, loading } = useQuery((client) => getSchemas(client));
 *   // ...
 * }
 * ```
 *
 * @packageDocumentation
 */

import { createClient, type HttpClient } from '@lyeve/cms-client';
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// Provider

export interface CmsConfig {
  /** Base URL prepended to every request path. */
  baseUrl?: string;
  /**
   * Callback returning headers added to every request.
   * Called on every request so auth tokens can be refreshed without
   * recreating the provider.
   */
  getHeaders?: () => Record<string, string>;
}

const CmsContext = createContext<CmsConfig | null>(null);

/**
 * Context provider that makes the CMS client available to all descendant
 * hooks.
 *
 * @example
 * ```tsx
 * <CmsProvider config={{ baseUrl: 'https://cms.example.com' }}>
 *   <App />
 * </CmsProvider>
 * ```
 */
export function CmsProvider({
  config,
  children,
}: {
  config: CmsConfig;
  children: ReactNode;
}) {
  return <CmsContext.Provider value={config}>{children}</CmsContext.Provider>;
}

/**
 * Returns a memoized HttpClient instance configured from the nearest
 * {@link CmsProvider}.
 */
function useClient(): HttpClient {
  const config = useContext(CmsContext);
  if (!config) {
    throw new Error('CmsProvider must wrap your component tree');
  }
  const base = config.baseUrl ?? '';

  return useRef(
    createClient((url, init) => {
      const fullUrl = typeof url === 'string' ? `${base}${url}` : url;
      return fetch(fullUrl, {
        ...init,
        headers: {
          ...init?.headers,
          ...config.getHeaders?.(),
        },
      });
    }),
  ).current;
}

// Hooks

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

/**
 * Reactive query hook. Runs `fetcher` on mount and whenever `deps` change.
 *
 * @param fetcher - Function that receives the configured HttpClient and returns a promise.
 * @param deps - Optional dependency array controlling when to refetch (default: `[]`).
 *
 * @example
 * ```ts
 * const { data, error, loading, refetch } = useQuery(
 *   (client) => getSchemas(client),
 * );
 * ```
 */
export function useQuery<T>(
  fetcher: (client: HttpClient) => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> & { refetch: () => void } {
  const client = useClient();
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));

    fetcher(client)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) =>
        setState({ data: null, error: error as Error, loading: false }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, refetch: run };
}

/**
 * Mutation hook. Returns a trigger function and the current state.
 *
 * @param mutator - Function that receives the configured HttpClient and variables.
 *
 * @example
 * ```ts
 * const [create, { loading, error }] = useMutation(
 *   (client, vars: { title: string }) => createArticle(client, vars),
 * );
 * // await create({ title: 'Hello' })
 * ```
 */
export function useMutation<T, V>(
  mutator: (client: HttpClient, vars: V) => Promise<T>,
): [(vars: V) => Promise<T>, AsyncState<T>] {
  const client = useClient();
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const run = useCallback(
    async (vars: V) => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const data = await mutator(client, vars);
        setState({ data, error: null, loading: false });
        return data;
      } catch (error) {
        setState({ data: null, error: error as Error, loading: false });
        throw error;
      }
    },
    [client],
  );

  return [run, state];
}
