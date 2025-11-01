/**
 * Router Composables Index
 * Exports all composable hooks and utilities for reactive router usage
 *
 * Phase Coverage:
 * - Phase 1-3: Core reactive state, basic composables, preloading
 * - Phase 4-6: Enhanced queries, guard improvements, data preloading
 * - Phase 7-10: Lazy loading, scroll management, middleware, lifecycle
 *
 * @module composables
 */

// ============================================================================
// PHASE 1-3: Core Features
// ============================================================================

// Core reactive state
export { createReactiveRoute, createTransitionState } from './reactiveState.js';

// Composable hooks
export { useRoute } from './useRoute.js';
export { useParams } from './useParams.js';
export { useQuery } from './useQuery.js';
export { useTransition } from './useTransition.js';

// Helper functions
export { createQueryHelpers } from './queryHelpers.js';
export { createNavigationEnhancers } from './navigationEnhancers.js';
export { createPreloadManager } from './preloadHooks.js';

// Main router enhancement (Phase 1-3)
export { enhanceRouter } from './routerEnhancer.js';

// ============================================================================
// PHASE 4-6: Advanced Features
// ============================================================================

// Phase 5: Guard Enhancements
export {
    createGuardEnhancers
} from './guardEnhancers.js';

// ============================================================================
// PHASE 7-10: Polish & Lifecycle
// ============================================================================

// Phase 7: Lazy Route Loading
export {
    lazyRoute,
    registerLazyLoadingState,
    createUseLazyRoute
} from './lazyRoutes.js';

// Phase 8: Scroll Position Management
export {
    createScrollManager,
    createUseScroll,
    integrateScrollManagement
} from './scrollManagement.js';

// Phase 9: Middleware/Interceptor Pattern
export {
    createMiddlewareSystem,
    middlewares,
    integrateMiddleware
} from './middleware.js';

// Phase 10: Navigation Lifecycle Hooks
export {
    createNavigationLifecycleManager,
    createUseNavigationLifecycle,
    integrateNavigationLifecycle
} from './navigationLifecycle.js';