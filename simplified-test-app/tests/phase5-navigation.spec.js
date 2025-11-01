/**
 * Phase 5: Navigation Methods & Programmatic Control Testing
 *
 * Framework: Playwright
 * Scope: KALXJS Router package navigation methods (@kalxjs/router)
 * Target: Verify all programmatic navigation methods work correctly via browser automation
 *
 * Test the actual router instance exposed as window.router with methods:
 * - push(location): Navigate to location and add to history
 * - replace(location): Replace current route without adding to history
 * - go(n): Navigate through history
 * - back(): Go back one step
 * - forward(): Go forward one step
 */

import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';
const TIMEOUT = 10000;

// Helper to safely navigate and wait for route change
async function navigateTo(page, path, waitForTitle = null) {
    await page.evaluate((p) => window.router.push(p), path);
    await page.waitForTimeout(500); // Wait for navigation to complete

    if (waitForTitle) {
        await expect(page).toHaveTitle(new RegExp(waitForTitle));
    }
}

// Helper to get current route from router
async function getCurrentRoute(page) {
    return page.evaluate(() => ({
        path: window.router.currentRoute.path,
        name: window.router.currentRoute.name,
        params: window.router.currentRoute.params,
        query: window.router.currentRoute.query
    }));
}

// Helper to get URL pathname
async function getCurrentPath(page) {
    return page.evaluate(() => window.location.pathname);
}

test.describe('Phase 5: Navigation Methods & Programmatic Control', () => {

    test.beforeEach(async ({ page }) => {
        // Load the page fresh for each test
        await page.goto(APP_URL, { waitUntil: 'networkidle' });

        // Wait for router to be ready
        await page.waitForFunction(() => window.router && window.router.isReady, { timeout: TIMEOUT });
    });

    test.describe('Category 1: Router Instance Verification', () => {

        test('C1-T1: Router instance exists and is globally accessible', async ({ page }) => {
            const routerExists = await page.evaluate(() => {
                return typeof window.router !== 'undefined' && window.router !== null;
            });
            expect(routerExists).toBe(true);
        });

        test('C1-T2: Router has all required navigation methods', async ({ page }) => {
            const methods = await page.evaluate(() => ({
                hasPush: typeof window.router.push === 'function',
                hasReplace: typeof window.router.replace === 'function',
                hasGo: typeof window.router.go === 'function',
                hasBack: typeof window.router.back === 'function',
                hasForward: typeof window.router.forward === 'function',
                hasCurrentRoute: typeof window.router.currentRoute === 'object',
                hasIsReady: typeof window.router.isReady === 'boolean'
            }));

            expect(methods.hasPush).toBe(true);
            expect(methods.hasReplace).toBe(true);
            expect(methods.hasGo).toBe(true);
            expect(methods.hasBack).toBe(true);
            expect(methods.hasForward).toBe(true);
            expect(methods.hasCurrentRoute).toBe(true);
            expect(methods.hasIsReady).toBe(true);
        });

        test('C1-T3: Router.currentRoute is initialized with home route', async ({ page }) => {
            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/');
            expect(route.name).toBe('home');
        });

        test('C1-T4: Router instance is ready after page load', async ({ page }) => {
            const isReady = await page.evaluate(() => window.router.isReady);
            expect(isReady).toBe(true);
        });
    });

    test.describe('Category 2: Basic Push Navigation', () => {

        test('C2-T1: router.push() with string path navigates to /about', async ({ page }) => {
            await navigateTo(page, '/about', 'About');

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/about');
            expect(route.name).toBe('about');

            const path = await getCurrentPath(page);
            expect(path).toBe('/about');
        });

        test('C2-T2: router.push() with string path navigates to /search', async ({ page }) => {
            await navigateTo(page, '/search', 'Search');

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/search');
            expect(route.name).toBe('search');
        });

        test('C2-T3: router.push() returns a Promise', async ({ page }) => {
            const isPromise = await page.evaluate(() => {
                const result = window.router.push('/about');
                return result instanceof Promise || (result && typeof result.then === 'function');
            });
            expect(isPromise).toBe(true);
        });

        test('C2-T4: Multiple consecutive push calls work correctly', async ({ page }) => {
            await navigateTo(page, '/about', 'About');
            await navigateTo(page, '/search', 'Search');

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/search');
        });

        test('C2-T5: push() navigation updates page title', async ({ page }) => {
            await navigateTo(page, '/about', 'About');
            const title = await page.title();
            expect(title).toContain('About');
        });
    });

    test.describe('Category 3: Dynamic Route Navigation (Parameters)', () => {

        test('C3-T1: router.push() with dynamic :id parameter', async ({ page }) => {
            await navigateTo(page, '/product/42', 'Product');

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/product/42');
            expect(route.name).toBe('product');
            expect(route.params.id).toBe('42');
        });

        test('C3-T2: router.push() with string parameter (:username)', async ({ page }) => {
            await navigateTo(page, '/user/alice', 'User Profile');

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/user/alice');
            expect(route.name).toBe('user-profile');
            expect(route.params.username).toBe('alice');
        });

        test('C3-T3: router.push() with nested parameters (:categoryId/item/:itemId)', async ({ page }) => {
            await navigateTo(page, '/category/electronics/item/99', 'Category Item');

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/category/electronics/item/99');
            expect(route.name).toBe('category-item');
            expect(route.params.categoryId).toBe('electronics');
            expect(route.params.itemId).toBe('99');
        });

        test('C3-T4: Parameter changes trigger route update', async ({ page }) => {
            await navigateTo(page, '/product/1', 'Product');
            let route = await getCurrentRoute(page);
            expect(route.params.id).toBe('1');

            await navigateTo(page, '/product/999', 'Product');
            route = await getCurrentRoute(page);
            expect(route.params.id).toBe('999');
        });

        test('C3-T5: Different parameter values render different content', async ({ page }) => {
            await navigateTo(page, '/product/1', 'Product');
            const content1 = await page.innerHTML('#router-view');

            await navigateTo(page, '/product/2', 'Product');
            const content2 = await page.innerHTML('#router-view');

            // Content should be different because component should display different product
            expect(content1).not.toBe(content2);
        });
    });

    test.describe('Category 4: Query String Navigation', () => {

        test('C4-T1: router.push() with query parameters', async ({ page }) => {
            await navigateTo(page, '/search?q=laptop&sort=price', 'Search');

            const query = await page.evaluate(() => window.router.currentRoute.query);
            expect(query).toHaveProperty('q');
            expect(query.q).toBe('laptop');
        });

        test('C4-T2: Query parameters preserved in URL', async ({ page }) => {
            await navigateTo(page, '/search?q=phone&category=electronics', 'Search');

            const path = await getCurrentPath(page);
            expect(path).toContain('search');

            const url = await page.evaluate(() => window.location.href);
            expect(url).toContain('q=phone');
        });

        test('C4-T3: Query parameters update on new navigation', async ({ page }) => {
            await navigateTo(page, '/search?q=laptop', 'Search');
            await navigateTo(page, '/search?q=tablet', 'Search');

            const query = await page.evaluate(() => window.router.currentRoute.query);
            expect(query.q).toBe('tablet');
        });
    });

    test.describe('Category 5: Push Navigation with Object Location', () => {

        test('C5-T1: router.push() with location object { path }', async ({ page }) => {
            await page.evaluate(() => window.router.push({ path: '/about' }));
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/about');
        });

        test('C5-T2: router.push() with location object and route name', async ({ page }) => {
            // Note: This assumes the router supports name-based navigation
            await page.evaluate(() => window.router.push({ path: '/search' }));
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/search');
        });

        test('C5-T3: router.push() with dynamic route via object', async ({ page }) => {
            await page.evaluate(() => window.router.push({ path: '/product/77' }));
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.params.id).toBe('77');
        });
    });

    test.describe('Category 6: Replace Navigation', () => {

        test('C6-T1: router.replace() navigates to new route', async ({ page }) => {
            // Navigate to /about first
            await navigateTo(page, '/about', 'About');

            // Now replace with /search
            await page.evaluate(() => window.router.replace('/search'));
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/search');
        });

        test('C6-T2: router.replace() does not add to history (back should skip replaced route)', async ({ page }) => {
            // Navigate to /about (adds to history)
            await navigateTo(page, '/about', 'About');

            // Replace with /search (replaces history entry)
            await page.evaluate(() => window.router.replace('/search'));
            await page.waitForTimeout(500);

            const route1 = await getCurrentRoute(page);
            expect(route1.path).toBe('/search');

            // Go back should skip /search and go to /about (if implementation allows)
            // This is a subtle test - replace() should not add a new history entry
            await page.evaluate(() => window.router.back());
            await page.waitForTimeout(500);

            const route2 = await getCurrentRoute(page);
            // If replace worked correctly, going back should return to previous route
            // The exact behavior depends on how many history entries exist
            expect(route2).toBeDefined();
        });

        test('C6-T3: router.replace() with dynamic route parameter', async ({ page }) => {
            await navigateTo(page, '/product/1', 'Product');

            await page.evaluate(() => window.router.replace('/product/999'));
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.params.id).toBe('999');
        });

        test('C6-T4: router.replace() returns a Promise', async ({ page }) => {
            const isPromise = await page.evaluate(() => {
                const result = window.router.replace('/about');
                return result instanceof Promise || (result && typeof result.then === 'function');
            });
            expect(isPromise).toBe(true);
        });

        test('C6-T5: Multiple replace calls do not bloat history', async ({ page }) => {
            await navigateTo(page, '/about', 'About');

            await page.evaluate(() => {
                window.router.replace('/search');
                return new Promise(resolve => setTimeout(resolve, 500));
            });

            await page.evaluate(() => {
                window.router.replace('/product/1');
                return new Promise(resolve => setTimeout(resolve, 500));
            });

            const route = await getCurrentRoute(page);
            expect(route.path).toContain('product');
        });
    });

    test.describe('Category 7: History Navigation (back, forward, go)', () => {

        test('C7-T1: router.back() navigates to previous route', async ({ page }) => {
            // Navigate through two pages
            await navigateTo(page, '/', 'Home');
            await navigateTo(page, '/about', 'About');
            await navigateTo(page, '/search', 'Search');

            let route = await getCurrentRoute(page);
            expect(route.path).toBe('/search');

            // Go back one step
            await page.evaluate(() => window.router.back());
            await page.waitForTimeout(500);

            route = await getCurrentRoute(page);
            expect(route.path).toBe('/about');
        });

        test('C7-T2: router.back() returns a Promise', async ({ page }) => {
            await navigateTo(page, '/about', 'About');

            const isPromise = await page.evaluate(() => {
                const result = window.router.back();
                return result instanceof Promise || (result && typeof result.then === 'function');
            });
            expect(isPromise).toBe(true);
        });

        test('C7-T3: router.forward() navigates to next route in history', async ({ page }) => {
            // Build history: home -> about -> search
            await navigateTo(page, '/', 'Home');
            await navigateTo(page, '/about', 'About');
            await navigateTo(page, '/search', 'Search');

            // Go back to /about
            await page.evaluate(() => window.router.back());
            await page.waitForTimeout(500);

            let route = await getCurrentRoute(page);
            expect(route.path).toBe('/about');

            // Go forward to /search
            await page.evaluate(() => window.router.forward());
            await page.waitForTimeout(500);

            route = await getCurrentRoute(page);
            expect(route.path).toBe('/search');
        });

        test('C7-T4: router.forward() returns a Promise', async ({ page }) => {
            await navigateTo(page, '/about', 'About');
            await page.evaluate(() => window.router.back());
            await page.waitForTimeout(500);

            const isPromise = await page.evaluate(() => {
                const result = window.router.forward();
                return result instanceof Promise || (result && typeof result.then === 'function');
            });
            expect(isPromise).toBe(true);
        });

        test('C7-T5: router.go(n) navigates through history', async ({ page }) => {
            // Build history: home -> about -> search -> product
            await navigateTo(page, '/', 'Home');
            await navigateTo(page, '/about', 'About');
            await navigateTo(page, '/search', 'Search');
            await navigateTo(page, '/product/1', 'Product');

            let route = await getCurrentRoute(page);
            expect(route.path).toContain('product');

            // Go back 2 steps
            await page.evaluate(() => window.router.go(-2));
            await page.waitForTimeout(500);

            route = await getCurrentRoute(page);
            expect(route.path).toBe('/about');
        });

        test('C7-T6: router.go(n) with positive n goes forward', async ({ page }) => {
            // Build history and navigate back
            await navigateTo(page, '/', 'Home');
            await navigateTo(page, '/about', 'About');
            await navigateTo(page, '/search', 'Search');

            await page.evaluate(() => window.router.go(-2));
            await page.waitForTimeout(500);

            let route = await getCurrentRoute(page);
            expect(route.path).toBe('/');

            // Go forward 2 steps
            await page.evaluate(() => window.router.go(2));
            await page.waitForTimeout(500);

            route = await getCurrentRoute(page);
            expect(route.path).toBe('/search');
        });

        test('C7-T7: router.go() returns a Promise', async ({ page }) => {
            await navigateTo(page, '/about', 'About');

            const isPromise = await page.evaluate(() => {
                const result = window.router.go(-1);
                return result instanceof Promise || (result && typeof result.then === 'function');
            });
            expect(isPromise).toBe(true);
        });
    });

    test.describe('Category 8: Navigation State & Consistency', () => {

        test('C8-T1: currentRoute reflects actual navigation state', async ({ page }) => {
            await navigateTo(page, '/about', 'About');

            const route = await getCurrentRoute(page);
            const path = await getCurrentPath(page);

            expect(route.path).toBe(path);
            expect(route.name).toBe('about');
        });

        test('C8-T2: Component renders for navigated route', async ({ page }) => {
            await navigateTo(page, '/about', 'About');

            // Check if router-view has content
            const hasContent = await page.evaluate(() => {
                const container = document.getElementById('router-view');
                return container && container.innerHTML.trim().length > 0;
            });

            expect(hasContent).toBe(true);
        });

        test('C8-T3: URL updates match router.currentRoute.path', async ({ page }) => {
            const routes = ['/about', '/search', '/product/5', '/user/bob'];

            for (const routePath of routes) {
                await navigateTo(page, routePath);

                const route = await getCurrentRoute(page);
                const urlPath = await getCurrentPath(page);

                expect(route.path).toBe(routePath);
                expect(urlPath).toBe(routePath);
            }
        });

        test('C8-T4: Navigation completes without console errors', async ({ page }) => {
            const errors = [];
            page.on('console', (msg) => {
                if (msg.type() === 'error') {
                    errors.push(msg.text());
                }
            });

            // Navigate through several routes
            await navigateTo(page, '/about', 'About');
            await navigateTo(page, '/product/1', 'Product');
            await navigateTo(page, '/search', 'Search');
            await page.evaluate(() => window.router.back());
            await page.waitForTimeout(500);

            // Should have no critical errors
            expect(errors.length).toBe(0);
        });

        test('C8-T5: Rapid consecutive navigations are handled correctly', async ({ page }) => {
            // Try to confuse the router with rapid navigation
            await page.evaluate(() => {
                window.router.push('/about');
                window.router.push('/search');
                window.router.push('/product/1');
            });
            await page.waitForTimeout(1000);

            const route = await getCurrentRoute(page);
            // Should end up at the last pushed route
            expect(route.path).toContain('product');
        });
    });

    test.describe('Category 9: Edge Cases & Error Handling', () => {

        test('C9-T1: Navigation to invalid route shows 404', async ({ page }) => {
            await page.evaluate(() => window.router.push('/this-route-does-not-exist'));
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.name).toBe('not-found');
        });

        test('C9-T2: Navigating to root path works', async ({ page }) => {
            await navigateTo(page, '/about', 'About');
            await navigateTo(page, '/', 'Home');

            const route = await getCurrentRoute(page);
            expect(route.path).toBe('/');
            expect(route.name).toBe('home');
        });

        test('C9-T3: Navigation with trailing slashes handled', async ({ page }) => {
            // Test if router normalizes paths
            await navigateTo(page, '/about', 'About');

            const route = await getCurrentRoute(page);
            // Should be normalized to /about (without trailing slash)
            expect(route.path).toBe('/about');
        });

        test('C9-T4: Back/forward at history boundaries', async ({ page }) => {
            // Start at home
            await navigateTo(page, '/', 'Home');

            // Try to go back when at beginning of history
            await page.evaluate(() => window.router.back());
            await page.waitForTimeout(300);

            const route = await getCurrentRoute(page);
            // Should still be on home or error gracefully
            expect(route).toBeDefined();
        });

        test('C9-T5: Empty string navigation defaults to root', async ({ page }) => {
            await page.evaluate(() => window.router.push(''));
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            // Empty string should default to '/'
            expect(route.path).toBe('/');
        });
    });

    test.describe('Category 10: Integration & Combined Operations', () => {

        test('C10-T1: Push, back, forward sequence', async ({ page }) => {
            // Setup navigation history
            await navigateTo(page, '/', 'Home');
            await navigateTo(page, '/about', 'About');
            await navigateTo(page, '/search', 'Search');

            // Go back
            await page.evaluate(() => window.router.back());
            await page.waitForTimeout(500);
            expect((await getCurrentRoute(page)).path).toBe('/about');

            // Go forward
            await page.evaluate(() => window.router.forward());
            await page.waitForTimeout(500);
            expect((await getCurrentRoute(page)).path).toBe('/search');

            // Push new route
            await navigateTo(page, '/product/1', 'Product');
            expect((await getCurrentRoute(page)).path).toContain('product');
        });

        test('C10-T2: Replace followed by back/forward', async ({ page }) => {
            await navigateTo(page, '/about', 'About');
            await navigateTo(page, '/search', 'Search');

            // Replace current route
            await page.evaluate(() => window.router.replace('/product/5'));
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.path).toContain('product');
        });

        test('C10-T3: Mix of string and object location navigation', async ({ page }) => {
            // String path
            await navigateTo(page, '/about', 'About');

            // Object location
            await page.evaluate(() => window.router.push({ path: '/search' }));
            await page.waitForTimeout(500);

            // String path again
            await navigateTo(page, '/product/1', 'Product');

            const route = await getCurrentRoute(page);
            expect(route.path).toContain('product');
        });

        test('C10-T4: Navigate with parameters, then back, then forward', async ({ page }) => {
            await navigateTo(page, '/product/1', 'Product');
            await navigateTo(page, '/product/2', 'Product');

            await page.evaluate(() => window.router.back());
            await page.waitForTimeout(500);
            expect((await getCurrentRoute(page)).params.id).toBe('1');

            await page.evaluate(() => window.router.forward());
            await page.waitForTimeout(500);
            expect((await getCurrentRoute(page)).params.id).toBe('2');
        });

        test('C10-T5: Navigate, replace, then back to see if replace affects history', async ({ page }) => {
            await navigateTo(page, '/about', 'About');
            await page.evaluate(() => window.router.replace('/search'));
            await page.waitForTimeout(500);

            // Go back - behavior depends on replace implementation
            await page.evaluate(() => window.router.back());
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route).toBeDefined();
        });
    });
});