# @lyeve-labs/client-react

React hooks for the LyEve Core. Typed, reactive data fetching built on
`@lyeve-labs/client`.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org)

```bash
pnpm add @lyeve-labs/client @lyeve-labs/client-react
```

```tsx
import { CmsProvider, useQuery, useMutation } from "@lyeve-labs/client-react";
import { getSchemas, createSchema } from "@lyeve-labs/client-rest";

function App() {
  return (
    <CmsProvider config={{ baseUrl: "https://cms.example.com" }}>
      <SchemaManager />
    </CmsProvider>
  );
}

function SchemaManager() {
  const { data, loading } = useQuery((client) => getSchemas(client));
  const [create, { loading: creating }] = useMutation(
    (client, vars: { name: string }) => createSchema(client, vars),
  );
  // ...
}
```

One provider at the root, typed hooks everywhere else. No boilerplate.

---

## What's in the box

- **CmsProvider:** context provider that wraps your component tree with CMS client
  configuration. `getHeaders` is called on every request so auth tokens stay fresh.
- **useQuery:** reactive data fetching hook. Runs on mount, returns `{ data, error,
loading, refetch }`. Preserves existing data on fetch errors to prevent UI flash.
- **useMutation:** mutation hook returning `[trigger, state]`. Loading/error/data
  tracked per invocation.
- **Stale-closure safe:** client re-creates when `baseUrl` or `getHeaders` change,
  so hooks always see the latest config.

## Requirements

- **Node 20** or newer
- **React 18** or newer
- **[@lyeve-labs/client](https://www.npmjs.com/package/@lyeve-labs/client)** `>=0.2.1`

## Install

```bash
pnpm add @lyeve-labs/client @lyeve-labs/client-react
# or npm install @lyeve-labs/client @lyeve-labs/client-react
# or yarn add @lyeve-labs/client @lyeve-labs/client-react
```

The examples below fetch through the REST helpers, which ship separately. Add
`@lyeve-labs/client-rest` if you want them, or pass any fetcher of your own.

## Use

### Provider

Wrap your app once at the root:

```tsx
import { CmsProvider } from "@lyeve-labs/client-react";

function App() {
  return (
    <CmsProvider
      config={{
        baseUrl: "https://cms.example.com",
        getHeaders: () => ({ Authorization: `Bearer ${getToken()}` }),
      }}
    >
      <YourRoutes />
    </CmsProvider>
  );
}
```

### useQuery

```tsx
import { useQuery } from "@lyeve-labs/client-react";
import { getSchemas } from "@lyeve-labs/client-rest";

function SchemaList() {
  const { data, error, loading, refetch } = useQuery((client) =>
    getSchemas(client),
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map((s) => (
        <li key={s.id}>{s.name}</li>
      ))}
    </ul>
  );
}
```

### useMutation

```tsx
import { useMutation } from "@lyeve-labs/client-react";
import { createSchema } from "@lyeve-labs/client-rest";

function CreateForm() {
  const [create, { loading, error }] = useMutation(
    (client, vars: { name: string }) => createSchema(client, vars),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await create({ name: "articles" });
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </button>
      {error && <p>{error.message}</p>}
    </form>
  );
}
```

## API

### CmsProvider

```ts
interface CmsConfig {
  baseUrl?: string;
  getHeaders?: () => Record<string, string>;
}

<CmsProvider config={config}>{children}</CmsProvider>
```

### useQuery

```ts
function useQuery<T>(
  fetcher: (client: HttpClient) => Promise<T>,
  deps?: unknown[],
): {
  data: T | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
};
```

Runs `fetcher` on mount and whenever `deps` change. Returns `refetch` for manual
re-execution.

### useMutation

```ts
function useMutation<T, V>(
  mutator: (client: HttpClient, vars: V) => Promise<T>,
): [
  (vars: V) => Promise<T>,
  { data: T | null; error: Error | null; loading: boolean },
];
```

Returns a trigger function and the current state.

## Local development

```bash
pnpm install            # install dependencies
pnpm test               # run unit tests
pnpm check              # type-check
pnpm build              # tsup + publint -> dist/
```

## Project layout

```
src/
  index.tsx          # CmsProvider, useQuery, useMutation
tests/               # vitest test suite
```

## Versioning

`@lyeve-labs/client-react` follows [SemVer](https://semver.org). While under `1.0`,
breaking changes bump the **minor** version; additive changes bump the **patch**.
Every release is logged in [`CHANGELOG.md`](CHANGELOG.md).

## Contributing

Bug reports and feature requests are welcome. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the development setup and conventions.

## License

MIT. See [`LICENSE`](LICENSE).
