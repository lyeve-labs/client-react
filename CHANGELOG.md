# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.1.1] - 2026-07-24

### Fixed

- Stale closure in `useClient`: replaced `useRef(...).current` with `useMemo` so the client re-creates when `config.baseUrl` or `config.getHeaders` change.
- Preserve existing data on fetch error instead of setting `null`, preventing UI flash during transient failures.
- Removed unused devDependencies (`@lyeve/cms-client-rest`, `@testing-library/jest-dom`).

## [0.1.0] - 2026-07-23

### Added

- Initial release.
- `CmsProvider` - context provider wrapping the component tree with CMS client configuration (base URL, auth headers).
- `useQuery` - reactive data fetching hook with loading/error/data state and manual refetch support.
- `useMutation` - mutation hook returning a trigger function alongside loading/error/data state.