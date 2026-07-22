# @lyeve/cms-client-react

React hooks for the LyEve CMS - typed, reactive data fetching built on `@lyeve/cms-client`.

## Install

```sh
pnpm add @lyeve/cms-client @lyeve/cms-client-react
```

## Usage

```tsx
import { CmsProvider, useQuery, useMutation } from '@lyeve/cms-client-react';
import { getSchemas, createSchema } from '@lyeve/cms-client-rest';

function App() {
  return (
    <CmsProvider
      config={{
        baseUrl: 'https://cms.example.com',
        getHeaders: () => ({ Authorization: `Bearer ${getToken()}` }),
      }}
    >
      <SchemaManager />
    </CmsProvider>
  );
}

function SchemaManager() {
  const { data: schemas, loading, error, refetch } = useQuery(
    (client) => getSchemas(client),
  );

  const [create, { loading: creating }] = useMutation(
    (client, vars: { name: string }) => createSchema(client, vars),
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {schemas?.map((s) => <li key={s.id}>{s.name}</li>)}
    </ul>
  );
}
```

## API

### `CmsProvider`

Wraps your component tree with CMS client configuration:

```tsx
<CmsProvider config={{ baseUrl, getHeaders }}>
  {children}
</CmsProvider>
```

- `baseUrl` - optional base URL prepended to every request path.
- `getHeaders` - optional callback returning headers added to every request.

### `useQuery(fetcher, deps?)`

Reactive data fetching hook:

```ts
const { data, error, loading, refetch } = useQuery(
  (client) => getSchemas(client),
  [], // optional dependency array
);
```

Runs `fetcher` on mount and whenever `deps` change. Returns `refetch` to re-run manually.

### `useMutation(mutator)`

Mutation hook for writes:

```ts
const [run, { data, error, loading }] = useMutation(
  (client, vars: Input) => createSchema(client, vars),
);
// run({ name: 'articles' }) > Promise<Result>
```

Returns a tuple: the trigger function and the current state.

## License

MIT
