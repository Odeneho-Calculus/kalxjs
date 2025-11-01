# Complete Router Integration Example

Real-world example showing how to integrate all router composables and features together.

## Complete Setup

```javascript
// app.js - Main application setup

import { createApp } from '@kalxjs/core';
import { createRouter, createWebHistory } from '@kalxjs/router';
import {
    enhanceRouter,
    lazyRoute,
    integrateScrollManagement,
    integrateMiddleware,
    middlewares,
    createGuardEnhancers,
    integrateNavigationLifecycle
} from '@kalxjs/router/composables';

// ============================================================================
// 1. Define Routes
// ============================================================================

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('./pages/Home.js'),
        meta: { title: 'Home' }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('./pages/Dashboard.js'),
        meta: { title: 'Dashboard', requiresAuth: true }
    },
    {
        path: '/user/:id',
        name: 'UserProfile',
        component: () => import('./pages/UserProfile.js'),
        meta: { title: 'User Profile', requiresAuth: true }
    },
    {
        path: '/admin',
        name: 'AdminPanel',
        component: lazyRoute(
            () => import('./pages/AdminPanel.js'),
            {
                loadingComponent: () => h('div', 'Loading admin...'),
                errorComponent: () => h('div', 'Error loading admin'),
                timeout: 10000
            }
        ),
        meta: { title: 'Admin', requiresAdmin: true }
    },
    {
        path: '/:pathMatch(.*)*',
        component: () => import('./pages/NotFound.js'),
        meta: { title: 'Not Found' }
    }
];

// ============================================================================
// 2. Create Base Router
// ============================================================================

const baseRouter = createRouter({
    history: createWebHistory(),
    routes
});

// ============================================================================
// 3. Enhance Router with All Composables
// ============================================================================

const router = enhanceRouter(baseRouter);

// ============================================================================
// 4. Integrate Scroll Management
// ============================================================================

const scrollManager = integrateScrollManagement(router, (to, from, savedPosition) => {
    // Custom scroll behavior
    if (savedPosition) {
        return savedPosition;
    } else if (to.hash) {
        return { selector: to.hash };
    } else if (to.path.startsWith('/admin')) {
        return { x: 0, y: 0 }; // Always top for admin
    } else {
        return { x: 0, y: 0 };
    }
});

// ============================================================================
// 5. Integrate Middleware System
// ============================================================================

const middleware = integrateMiddleware(router);

// Auth middleware - runs very first
middleware.before(
    middlewares.auth(
        () => {
            // Check authentication from auth service
            const auth = useAuthStore?.();
            return auth?.isAuthenticated;
        },
        '/login'
    ),
    { priority: 100 }
);

// Analytics middleware - runs after navigation
middleware.after(
    middlewares.analytics((event) => {
        // Track page view
        const analytics = useAnalyticsStore?.();
        analytics?.trackPageView({
            page: event.page,
            referrer: event.referrer,
            timestamp: event.timestamp
        });
    }),
    { priority: 50 }
);

// Progress bar middleware
const progressBar = {
    start: () => console.log('Navigation started'),
    finish: () => console.log('Navigation finished')
};

middleware.before(
    middlewares.progress(progressBar),
    { priority: 90 }
);

// Logging middleware
middleware.use(
    middlewares.logger(),
    { phase: 'before', priority: 80 }
);

// Error handling
middleware.onError((error, to, from, handle) => {
    console.error(`Navigation error from ${from?.path} to ${to?.path}:`, error);

    if (error.message.includes('permission')) {
        // Handle permission error
        handle(); // Mark as handled
    }
});

// ============================================================================
// 6. Register Guard Enhancements
// ============================================================================

const guardEnhancers = createGuardEnhancers({
    baseRouter: router,
    transitionState: router._transitionState
});

// Custom guard with cancellation support
guardEnhancers.beforeEach(
    async (to, from, next, signal) => {
        // Check if route requires admin
        if (to.meta?.requiresAdmin) {
            const user = getCurrentUser();
            if (!user || !user.isAdmin) {
                console.log('Admin access denied');
                return;
            }
        }

        // Listen for navigation cancellation
        signal.addEventListener('abort', () => {
            console.log('User cancelled navigation to:', to.path);
        });

        // Allow navigation
        next();
    },
    { priority: 70 }
);

// ============================================================================
// 7. Register Route Data Preloading
// ============================================================================

// Preload user profile data
router.registerPreload('UserProfile', async (params) => {
    return {
        user: await fetchUser(params.id),
        posts: await fetchUserPosts(params.id)
    };
});

// Preload dashboard data
router.registerPreload('Dashboard', async (params) => {
    return {
        stats: await fetchDashboardStats(),
        widgets: await fetchWidgets()
    };
});

// ============================================================================
// 8. Create App and Configure
// ============================================================================

const app = createApp({
    render: () => {
        const { transition } = router.useRoute();

        return h('div', { class: 'app' }, [
            // Global loading indicator
            transition.value.isLoading && h('div', { class: 'global-loader' }),

            // Main router view
            h('RouterView'),

            // Global error display
            transition.value.error && h('div', {
                class: 'error-banner',
                onClick: () => router.go(0)
            }, `Error: ${transition.value.error.message}`)
        ]);
    }
});

app.use(router);

// ============================================================================
// 9. Mount Application
// ============================================================================

app.mount('#app');

export { router, middleware, scrollManager, guardEnhancers };
```

---

## Component Examples

### Example 1: User Profile with Lifecycle Hooks

```javascript
// pages/UserProfile.js

import { defineComponent, ref, watch, onBeforeUnmount } from '@kalxjs/core';
import { useNavigationLifecycle } from '@kalxjs/router/composables';

export default defineComponent({
    name: 'UserProfile',

    setup() {
        const {
            route,
            params,
            state,
            transition,
            getPreloadedData,
            setState
        } = window.router.useRoute();

        const userPosts = ref([]);
        const isEditing = ref(false);

        // Get preloaded data
        const preloadedData = getPreloadedData();
        const user = preloadedData?.user;

        // Watch for user ID changes
        watch(() => params.value.id, async (id) => {
            if (id && !preloadedData?.user) {
                // Preload wasn't done, fetch here
                const userData = await fetchUser(id);
                user.value = userData;
            }
        });

        // Setup lifecycle hooks
        const lifecycle = useNavigationLifecycle(this);

        // Warn about unsaved changes
        lifecycle.onBeforeNavigate(async (to, from) => {
            if (isEditing.value) {
                return confirm('You have unsaved changes. Discard?');
            }
        });

        // Track page view
        lifecycle.onAfterNavigate((to, from) => {
            console.log(`Viewed profile: ${params.value.id}`);
        });

        // Save scroll position
        const { save, restore, scrollToTop } = window.router._scrollManager
            ? (() => {
                const sm = window.router._scrollManager;
                return {
                    save: () => sm.saveScrollPosition(route.value?.path),
                    restore: () => sm.restoreScrollPosition(route.value?.path, false),
                    scrollToTop: () => sm.scrollTo(0, 0)
                };
            })()
            : { save: () => {}, restore: () => {}, scrollToTop: () => {} };

        onBeforeUnmount(() => {
            save();
            lifecycle.clear();
        });

        // Handle navigation state from list view
        const fromListSearch = state.value?.searchQuery;

        return {
            user,
            userPosts,
            isEditing,
            transition,
            params,
            fromListSearch,
            scrollToTop
        };
    },

    template: `
        <div class="user-profile">
            <!-- Header -->
            <header>
                <h1>{{ user?.name }}</h1>
                <button @click="scrollToTop">↑ Back to top</button>
            </header>

            <!-- Loading State -->
            <div v-if="transition.isLoading" class="spinner">
                Loading profile...
            </div>

            <!-- Error State -->
            <div v-else-if="transition.error" class="error">
                {{ transition.error.message }}
            </div>

            <!-- Content -->
            <div v-else class="profile-content">
                <!-- User Info -->
                <section class="info">
                    <img :src="user?.avatar" :alt="user?.name" />
                    <div class="details">
                        <p>Email: {{ user?.email }}</p>
                        <p>Joined: {{ user?.joinDate }}</p>
                        <button @click="isEditing = true">Edit Profile</button>
                    </div>
                </section>

                <!-- User Posts -->
                <section class="posts">
                    <h2>Posts</h2>
                    <div v-if="userPosts.length">
                        <article v-for="post in userPosts" :key="post.id">
                            <h3>{{ post.title }}</h3>
                            <p>{{ post.excerpt }}</p>
                        </article>
                    </div>
                    <div v-else>
                        No posts yet
                    </div>
                </section>

                <!-- Breadcrumb from state -->
                <nav v-if="fromListSearch" class="breadcrumb">
                    <a href="#" @click="$router.back()">
                        ← Back to search: "{{ fromListSearch }}"
                    </a>
                </nav>
            </div>
        </div>
    `
});
```

### Example 2: Search with Query Parameters

```javascript
// pages/Search.js

import { defineComponent, ref, computed } from '@kalxjs/core';

export default defineComponent({
    name: 'Search',

    setup() {
        const { query, updateQuery, removeQueryParam, clearQuery } = window.router.useQuery();

        const searchInput = ref(query.value.q || '');
        const results = ref([]);

        // Computed for current filter
        const currentFilter = computed(() => query.value.filter || 'all');

        // Watch query changes
        watch(() => query.value, async (newQuery) => {
            if (newQuery.q) {
                results.value = await searchAPI.search(newQuery.q, {
                    filter: newQuery.filter,
                    sort: newQuery.sort,
                    page: newQuery.page || 1
                });
            }
        }, { deep: true });

        // Handle search
        const handleSearch = async (term) => {
            await updateQuery({
                q: term,
                page: 1 // Reset pagination
            });
        };

        // Handle filter
        const handleFilter = async (filter) => {
            await updateQuery({
                filter,
                page: 1
            });
        };

        // Handle pagination
        const handlePagination = async (page) => {
            await updateQuery({ page });
        };

        // Clear search
        const handleClear = async () => {
            searchInput.value = '';
            await clearQuery();
            results.value = [];
        };

        return {
            searchInput,
            results,
            currentFilter,
            query,
            handleSearch,
            handleFilter,
            handlePagination,
            handleClear
        };
    },

    template: `
        <div class="search">
            <!-- Search Box -->
            <div class="search-box">
                <input
                    v-model="searchInput"
                    type="text"
                    placeholder="Search..."
                    @change="handleSearch(searchInput)"
                />
                <button v-if="query.q" @click="handleClear">Clear</button>
            </div>

            <!-- Filters -->
            <div class="filters">
                <label>
                    <input
                        type="radio"
                        value="all"
                        :checked="currentFilter === 'all'"
                        @change="handleFilter('all')"
                    />
                    All
                </label>
                <label>
                    <input
                        type="radio"
                        value="recent"
                        :checked="currentFilter === 'recent'"
                        @change="handleFilter('recent')"
                    />
                    Recent
                </label>
                <label>
                    <input
                        type="radio"
                        value="popular"
                        :checked="currentFilter === 'popular'"
                        @change="handleFilter('popular')"
                    />
                    Popular
                </label>
            </div>

            <!-- Results -->
            <div class="results">
                <div v-if="results.length">
                    <item v-for="item in results" :key="item.id" :item="item" />
                </div>
                <div v-else class="empty">
                    {{ query.q ? 'No results found' : 'Enter a search term' }}
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="results.length" class="pagination">
                <button
                    @click="handlePagination((query.page || 1) - 1)"
                    :disabled="!query.page || query.page === 1"
                >
                    ← Previous
                </button>
                <span>Page {{ query.page || 1 }}</span>
                <button @click="handlePagination((query.page || 1) + 1)">
                    Next →
                </button>
            </div>
        </div>
    `
});
```

### Example 3: Dashboard with Lazy Loading

```javascript
// pages/Dashboard.js

import { defineComponent, ref, computed } from '@kalxjs/core';
import { useLazyRoute } from '@kalxjs/router/composables';

export default defineComponent({
    name: 'Dashboard',

    setup() {
        const { transition, getPreloadedData } = window.router.useRoute();
        const stats = ref(null);
        const widgets = ref([]);

        // Get preloaded data
        const preloaded = getPreloadedData();
        if (preloaded) {
            stats.value = preloaded.stats;
            widgets.value = preloaded.widgets;
        }

        // Check if everything is ready
        const isReady = computed(() => stats.value && widgets.value.length > 0);

        return {
            transition,
            stats,
            widgets,
            isReady
        };
    },

    template: `
        <div class="dashboard">
            <h1>Dashboard</h1>

            <!-- Loading State from Transition -->
            <div v-if="transition.isLoading" class="loading">
                <p>Loading dashboard data...</p>
                <p>Pending: {{ transition.isPending ? 'Yes' : 'No' }}</p>
            </div>

            <!-- Error State -->
            <div v-else-if="transition.error" class="error">
                Failed to load dashboard: {{ transition.error.message }}
            </div>

            <!-- Content -->
            <div v-else-if="isReady" class="content">
                <!-- Stats Section -->
                <section class="stats">
                    <h2>Statistics</h2>
                    <div class="stat-grid">
                        <div v-for="stat in stats" :key="stat.id" class="stat-card">
                            <h3>{{ stat.label }}</h3>
                            <p class="value">{{ stat.value }}</p>
                            <p class="change" :class="stat.trend">
                                {{ stat.change }}%
                            </p>
                        </div>
                    </div>
                </section>

                <!-- Widgets Section -->
                <section class="widgets">
                    <h2>Widgets</h2>
                    <div class="widget-grid">
                        <div v-for="widget in widgets" :key="widget.id" class="widget">
                            <h3>{{ widget.title }}</h3>
                            <component :is="widget.component" />
                        </div>
                    </div>
                </section>
            </div>

            <!-- Placeholder -->
            <div v-else class="placeholder">
                Preparing dashboard...
            </div>
        </div>
    `
});
```

---

## Advanced Patterns

### Pattern 1: Protected Routes

```javascript
// middleware for protected routes
middleware.before(
    async (to, from, next) => {
        if (to.meta?.requiresAuth) {
            const user = getCurrentUser();
            if (!user) {
                // Store intended destination
                await router.push({
                    path: '/login',
                    state: { from: to.path }
                });
                return;
            }
        }
        next();
    },
    { priority: 100 }
);
```

### Pattern 2: Data Preloading Chain

```javascript
// Preload with dependencies
router.registerPreload('nested-route', async (params) => {
    // Fetch parent first
    const parent = await fetchParent(params.parentId);

    // Then fetch children with parent data
    const children = await fetchChildren(parent.id);

    return { parent, children };
});
```

### Pattern 3: Navigation State Recovery

```javascript
// Save state before leaving
lifecycle.onBeforeNavigate(async (to, from) => {
    // Save form data to state
    const formData = collectFormData();
    await router.push({
        path: to.path,
        state: { formData }
    });
});

// Restore state on return
lifecycle.onAfterNavigate((to, from) => {
    const savedForm = to.state?.formData;
    if (savedForm) {
        restoreFormData(savedForm);
    }
});
```

### Pattern 4: Conditional Navigation

```javascript
// Cancel navigation if unsaved
middleware.before(
    middlewares.conditional(
        (to, from) => hasUnsavedChanges(),
        async (to, from, next) => {
            const confirmed = await showDialog('Unsaved changes. Continue?');
            if (confirmed) {
                next();
            }
        }
    ),
    { priority: 80 }
);
```

---

## Testing This Setup

```javascript
// test.js
import { describe, test, expect } from 'jest';

describe('Router Integration', () => {
    test('navigation with middleware executes correctly', async () => {
        const executed = [];

        middleware.before(async (to, from, next) => {
            executed.push('before');
            next();
        });

        await router.push('/dashboard');

        expect(executed).toContain('before');
    });

    test('preload data available after navigation', async () => {
        router.registerPreload('test', async () => ({
            data: 'loaded'
        }));

        await router.push('/test');

        const { getPreloadedData } = router.useRoute();
        expect(getPreloadedData()?.data).toBe('loaded');
    });

    test('scroll position restores on back', async () => {
        scrollManager.saveScrollPosition('/page1');

        await router.push('/page2');
        await router.back();

        expect(scrollManager.scrollPositions.get('/page1')).toBeDefined();
    });
});
```

---

**This integration example demonstrates all 10 phases working together seamlessly!**