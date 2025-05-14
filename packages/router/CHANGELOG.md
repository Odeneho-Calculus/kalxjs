# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.18](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.17...@kalxjs/router@2.0.18) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.17](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.16...@kalxjs/router@2.0.17) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.16](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.15...@kalxjs/router@2.0.16) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.15](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.9...@kalxjs/router@2.0.15) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.14](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.9...@kalxjs/router@2.0.14) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.13](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.9...@kalxjs/router@2.0.13) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.12](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.9...@kalxjs/router@2.0.12) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.11](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.9...@kalxjs/router@2.0.11) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [0.1.3](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.9...@kalxjs/router@0.1.3) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [0.1.2](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.9...@kalxjs/router@0.1.2) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [0.1.1](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.9...@kalxjs/router@0.1.1) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.9](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.8...@kalxjs/router@2.0.9) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.8](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.7...@kalxjs/router@2.0.8) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.7](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.6...@kalxjs/router@2.0.7) (2025-05-14)

**Note:** Version bump only for package @kalxjs/router

## [2.0.6](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.5...@kalxjs/router@2.0.6) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [2.0.5](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.4...@kalxjs/router@2.0.5) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [2.0.4](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.3...@kalxjs/router@2.0.4) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [2.0.3](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.2...@kalxjs/router@2.0.3) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [2.0.2](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@2.0.1...@kalxjs/router@2.0.2) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [2.0.1](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.34...@kalxjs/router@2.0.1) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [2.0.0](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.34...@kalxjs/router@2.0.0) (2024-07-01)

### Major Enhancements

- **Complete Router Rewrite**: Rebuilt from the ground up to surpass Vue Router in features and capabilities
- **Promise-Based Navigation**: All navigation methods now return promises for better async flow control
- **Advanced Route Matching**: Enhanced pattern matching with regex support, optional parameters, and more
- **Multiple History Modes**: Support for HTML5 history, hash history, and memory history (for testing/SSR)
- **Enhanced Navigation Guards**: More powerful guard system with better redirect handling and async support
- **Improved Scroll Behavior**: Advanced scroll position management with hash scrolling and saved position restoration
- **Advanced Query Parameter Handling**: Better parsing and stringifying of query parameters with support for arrays and custom handlers

### New Features

- **History API Implementations**:

  - `createWebHistory`: HTML5 History API implementation
  - `createWebHashHistory`: Hash-based history implementation
  - `createMemoryHistory`: In-memory history for testing and SSR

- **Enhanced Route Matching**:

  - Support for regex patterns in route parameters: `/users/:id(\\d+)`
  - Optional parameters: `/users/:id?`
  - Custom parameter patterns: `/products/:category([a-z]+)/:id(\\d+)`
  - Catch-all routes with named parameter: `/:pathMatch(.*)*`

- **Advanced Navigation Guards**:

  - Global guards: `beforeEach`, `beforeResolve`, `afterEach`
  - Per-route guards: `beforeEnter` (supports arrays of guards)
  - Return-based redirects: `return '/login'` or `return { path: '/login' }`
  - Promise-based guard resolution

- **Enhanced RouterLink Component**:

  - Active class management: `activeClass`, `exactActiveClass`
  - ARIA support: `ariaCurrentValue`
  - Custom rendering: `custom` prop
  - Replace mode: `replace` prop

- **Enhanced RouterView Component**:

  - Better error handling
  - Support for nested routes
  - Improved component rendering

- **Enhanced useRouter Composition API**:

  - More reactive properties: `hash`, `fullPath`, `meta`, `name`, `matched`
  - Route matching helpers: `isActive`, `isExactActive`
  - Route construction helpers: `resolve`
  - Navigation guard access: `beforeEach`, `beforeResolve`, `afterEach`

- **Dynamic Route Management**:
  - `addRoute`: Add routes dynamically
  - `removeRoute`: Remove routes by name
  - `hasRoute`: Check if a route exists
  - `getRoutes`: Get all route records

### Improvements

- **Better TypeScript Support**: Enhanced type definitions for routes, params, and meta fields
- **Improved Error Handling**: Better error messages and handling of navigation failures
- **Enhanced Documentation**: Comprehensive API reference and migration guide
- **Better Performance**: Optimized route matching and navigation
- **Improved Compatibility**: Better support for different environments (browser, SSR, testing)

### Breaking Changes

- **Router Creation**: Now requires a history implementation
- **Navigation Methods**: Now return promises instead of being void
- **Route Matching**: More strict matching rules
- **Navigation Guards**: Changed behavior for redirects

## [1.2.33](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.32...@kalxjs/router@1.2.33) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.32](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.31...@kalxjs/router@1.2.32) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.31](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.30...@kalxjs/router@1.2.31) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.30](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.29...@kalxjs/router@1.2.30) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.29](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.28...@kalxjs/router@1.2.29) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.28](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.27...@kalxjs/router@1.2.28) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.27](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.26...@kalxjs/router@1.2.27) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.26](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.25...@kalxjs/router@1.2.26) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.25](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.24...@kalxjs/router@1.2.25) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.24](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.23...@kalxjs/router@1.2.24) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.23](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.22...@kalxjs/router@1.2.23) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.22](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.21...@kalxjs/router@1.2.22) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.21](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.20...@kalxjs/router@1.2.21) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.20](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.19...@kalxjs/router@1.2.20) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.19](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.18...@kalxjs/router@1.2.19) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.18](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.16...@kalxjs/router@1.2.18) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.16](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.15...@kalxjs/router@1.2.16) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.15](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.14...@kalxjs/router@1.2.15) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.14](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.13...@kalxjs/router@1.2.14) (2025-05-15)

### Bug Fixes

- **router:** Improve router instance detection in useRouter function ([#125](https://github.com/Odeneho-Calculus/kalxjs/issues/125))
  - Fixed "useRouter() was called with no active router on the page" warning
  - Added multiple router detection strategies for better compatibility
  - Improved fallback implementation with more helpful error messages
  - Register router globally for easier access by useRouter()

## [1.2.14](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.12...@kalxjs/router@1.2.14) (2025-05-13)

**Note:** Version bump only for package @kalxjs/router

## [1.2.13](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.12...@kalxjs/router@1.2.13) (2025-05-15)

### Features

- **router:** Add `useRouter` composition API function ([#123](https://github.com/Odeneho-Calculus/kalxjs/issues/123))
  - Added new `useRouter()` function to access router from any component
  - Provides reactive route state (params, query, path)
  - Includes navigation methods (push, replace, go, back, forward)
  - Updated documentation with examples

## [1.2.12](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.11...@kalxjs/router@1.2.12) (2025-05-12)

**Note:** Version bump only for package @kalxjs/router

## [1.2.11](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.10...@kalxjs/router@1.2.11) (2025-05-12)

**Note:** Version bump only for package @kalxjs/router

## [1.2.10](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.9...@kalxjs/router@1.2.10) (2025-05-12)

**Note:** Version bump only for package @kalxjs/router

## [1.2.9](https://github.com/Odeneho-Calculus/kalxjs/compare/@kalxjs/router@1.2.7...@kalxjs/router@1.2.9) (2025-05-12)

**Note:** Version bump only for package @kalxjs/router

## 1.2.7 (2025-05-12)

**Note:** Version bump only for package @kalxjs/router
