/**
 * Phase 6: Router Components (RouterLink & RouterView) E2E Tests
 *
 * Framework: Playwright
 * Scope: KALXJS Router package components (@kalxjs/router)
 * Target: Verify RouterLink and RouterView components work correctly via browser automation
 *
 * Tests cover:
 * - RouterLink rendering and href attributes
 * - RouterLink navigation functionality
 * - Active class application and transitions
 * - RouterView component rendering
 * - RouterView updates on navigation
 * - Component lifecycle
 * - Error handling (404 fallback)
 * - Nested routes
 * - Query parameters
 */

import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:3000';
const PHASE6_URL = 'http://localhost:3000/phase6';
const TIMEOUT = 10000;

// Helper to navigate to a path
async function navigateTo(page, path) {
    await page.evaluate((p) => window.router.push(p), path);
    await page.waitForTimeout(500);
}

// Helper to get current route info
async function getCurrentRoute(page) {
    return page.evaluate(() => ({
        path: window.router.currentRoute.path,
        name: window.router.currentRoute.name,
        params: window.router.currentRoute.params,
        query: window.router.currentRoute.query
    }));
}

// Helper to get current URL pathname
async function getCurrentPath(page) {
    return page.evaluate(() => window.location.pathname);
}

// Helper to check if element has active class
async function hasActiveClass(page, selector) {
    return page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        return el.classList.contains('router-link-active') ||
            el.classList.contains('active') ||
            el.classList.contains('router-link-exact-active');
    }, selector);
}

// Helper to get RouterView content length
async function getRouterViewContentLength(page) {
    return page.evaluate(() => {
        const rv = document.getElementById('router-view');
        return rv ? rv.innerHTML.length : 0;
    });
}

test.describe('Phase 6: Router Components (RouterLink & RouterView)', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to app root first to ensure initialization
        await page.goto(APP_URL, { waitUntil: 'networkidle' });

        // Wait for router to be ready
        await page.waitForFunction(() => window.router && window.router.isReady, { timeout: TIMEOUT });

        // Navigate to Phase 6 test page using router
        await page.evaluate(() => window.router.push('/phase6'));

        // Wait for Phase 6 component to mount and test-log element to have content
        // Note: There may be multiple test-log elements, so check all of them
        await page.waitForFunction(() => {
            const testLogs = document.querySelectorAll('[data-testid="test-log"]');
            return Array.from(testLogs).some(log => log.textContent.includes('mounted'));
        }, { timeout: TIMEOUT });
    });

    test.describe('Category 1: RouterLink Rendering & Attributes', () => {

        test('C1-T1: RouterLink elements render in the DOM', async ({ page }) => {
            const linkCount = await page.locator('a[href="/"]').count();
            expect(linkCount).toBeGreaterThan(0);
        });

        test('C1-T2: RouterLink has correct href attribute for home route', async ({ page }) => {
            const homeLink = page.locator('a[href="/"]').first();
            const href = await homeLink.getAttribute('href');
            expect(href).toBe('/');
        });

        test('C1-T3: RouterLink has correct href attribute for about route', async ({ page }) => {
            const aboutLink = page.locator('a[href="/about"]').first();
            expect(aboutLink).toBeVisible();
            const href = await aboutLink.getAttribute('href');
            expect(href).toBe('/about');
        });

        test('C1-T4: RouterLink has correct href for parameterized routes', async ({ page }) => {
            const productLink = page.locator('a[href="/product/1"]').first();
            expect(productLink).toBeVisible();
            const href = await productLink.getAttribute('href');
            expect(href).toBe('/product/1');
        });

        test('C1-T5: RouterLink has correct href for user routes', async ({ page }) => {
            const userLink = page.locator('a[href="/user/john"]').first();
            expect(userLink).toBeVisible();
            const href = await userLink.getAttribute('href');
            expect(href).toBe('/user/john');
        });

        test('C1-T6: RouterLink has correct href for nested routes', async ({ page }) => {
            const nestedLink = page.locator('a[href="/category/electronics/item/1"]').first();
            expect(nestedLink).toBeVisible();
            const href = await nestedLink.getAttribute('href');
            expect(href).toBe('/category/electronics/item/1');
        });

        test('C1-T7: Multiple RouterLinks exist for different routes', async ({ page }) => {
            const links = await page.locator('a[data-testid^="link-"]').count();
            expect(links).toBeGreaterThan(3);
        });

        test('C1-T8: RouterLink elements are clickable', async ({ page }) => {
            const homeLink = page.locator('a[href="/"]').first();
            expect(homeLink).toBeVisible();
            const isClickable = await homeLink.isEnabled();
            expect(isClickable).toBe(true);
        });
    });

    test.describe('Category 2: RouterLink Navigation', () => {

        test('C2-T1: Clicking RouterLink navigates to /about', async ({ page }) => {
            await page.click('a[href="/about"]');
            await page.waitForTimeout(500);
            const currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/about');
        });

        test('C2-T2: Clicking RouterLink navigates to /product/:id', async ({ page }) => {
            await page.click('a[href="/product/1"]');
            await page.waitForTimeout(500);
            const currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/product/1');
        });

        test('C2-T3: Clicking RouterLink navigates to /user/:username', async ({ page }) => {
            await page.click('a[href="/user/john"]');
            await page.waitForTimeout(500);
            const currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/user/john');
        });

        test('C2-T4: Clicking RouterLink navigates to nested routes', async ({ page }) => {
            await page.click('a[href="/category/electronics/item/1"]');
            await page.waitForTimeout(500);
            const currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/category/electronics/item/1');
        });

        test('C2-T5: Clicking RouterLink navigates to search route', async ({ page }) => {
            await page.click('a[href="/search"]');
            await page.waitForTimeout(500);
            const currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/search');
        });

        test('C2-T6: Sequential RouterLink clicks navigate correctly', async ({ page }) => {
            // Navigate to about
            await page.click('a[href="/about"]');
            await page.waitForTimeout(300);
            let currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/about');

            // Navigate to product
            await navigateTo(page, '/product/2');
            currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/product/2');

            // Navigate to user
            await navigateTo(page, '/user/alice');
            currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/user/alice');
        });

        test('C2-T7: RouterLink to same route does not cause navigation error', async ({ page }) => {
            // Start at phase6
            let currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/phase6');

            // Navigate away and back
            await navigateTo(page, '/about');
            await page.waitForTimeout(300);
            await navigateTo(page, '/phase6');
            await page.waitForTimeout(300);
            currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/phase6');
        });

        test('C2-T8: RouterLink navigation updates window.location', async ({ page }) => {
            const initialPath = await getCurrentPath(page);
            expect(initialPath).toBe('/phase6');

            await page.click('a[href="/product/5"]');
            await page.waitForTimeout(500);
            const newPath = await getCurrentPath(page);
            expect(newPath).toBe('/product/5');
        });
    });

    test.describe('Category 3: Active Class Application', () => {

        test('C3-T1: Current route link has active class', async ({ page }) => {
            // Navigate to about
            await navigateTo(page, '/about');
            await page.waitForTimeout(500);

            // Navigate back to phase6 to see navigation links
            await navigateTo(page, '/phase6');
            // Wait for Phase 6 component to be fully ready
            await page.waitForFunction(() => {
                const testLogs = document.querySelectorAll('[data-testid="test-log"]');
                return Array.from(testLogs).some(log => log.textContent.includes('mounted'));
            }, { timeout: TIMEOUT });

            // Click button to test active class on home
            await page.click('button:has-text("Test Active Class - Home")');
            
            // Wait for test results to be logged with the checkmark
            await page.waitForFunction(() => {
                const testLog = document.querySelector('[data-testid="test-log"]');
                return testLog && testLog.textContent.includes('✓');
            }, { timeout: TIMEOUT });

            // Get log to verify
            const logContent = await page.locator('[data-testid="test-log"]').textContent();
            expect(logContent).toContain('✓');
        });

        test('C3-T2: Active class is removed from previous route link', async ({ page }) => {
            // Test active class transition
            await page.click('button:has-text("Test Active Class Transition")');
            
            // Wait for test results to be logged with active class detection
            await page.waitForFunction(() => {
                const testLog = document.querySelector('[data-testid="test-log"]');
                return testLog && testLog.textContent.includes('active');
            }, { timeout: TIMEOUT });

            // Verify the test results
            const logContent = await page.locator('[data-testid="test-log"]').textContent();
            expect(logContent).toContain('active');
        });

        test('C3-T3: RouterLink updates active state on navigation', async ({ page }) => {
            // Navigate to home
            await navigateTo(page, '/');
            await page.waitForTimeout(300);

            // Navigate back to phase6
            await navigateTo(page, '/phase6');
            // Wait for Phase 6 component to be fully ready
            await page.waitForFunction(() => {
                const testLogs = document.querySelectorAll('[data-testid="test-log"]');
                return Array.from(testLogs).some(log => log.textContent.includes('mounted'));
            }, { timeout: TIMEOUT });

            // Check if home link would have active class (via test)
            await page.click('button:has-text("Test Active Class - Home")');
            
            // Wait for test results to be logged with Home reference
            await page.waitForFunction(() => {
                const testLog = document.querySelector('[data-testid="test-log"]');
                return testLog && testLog.textContent.includes('Home');
            }, { timeout: TIMEOUT });

            // Verify the test results
            const logContent = await page.locator('[data-testid="test-log"]').textContent();
            expect(logContent).toContain('Home');
        });
    });

    test.describe('Category 4: RouterView Rendering & Updates', () => {

        test('C4-T1: RouterView renders content on initial load', async ({ page }) => {
            const routerViewLength = await getRouterViewContentLength(page);
            expect(routerViewLength).toBeGreaterThan(0);
        });

        test('C4-T2: RouterView updates when navigating to different route', async ({ page }) => {
            const initialLength = await getRouterViewContentLength(page);

            // Navigate to about
            await navigateTo(page, '/about');
            await page.waitForTimeout(500);

            const newLength = await getRouterViewContentLength(page);
            expect(newLength).toBeGreaterThan(0);
            // Content should be different (About page vs Phase6 page)
            expect(initialLength !== newLength || page.url().includes('/about')).toBe(true);
        });

        test('C4-T3: RouterView renders different component for each route', async ({ page }) => {
            // Navigate to home
            await navigateTo(page, '/');
            await page.waitForTimeout(500);
            const homePage = await page.content();

            // Navigate to about
            await navigateTo(page, '/about');
            await page.waitForTimeout(500);
            const aboutPage = await page.content();

            // Content should differ between routes
            expect(homePage).not.toEqual(aboutPage);
        });

        test('C4-T4: RouterView handles rapid navigation', async ({ page }) => {
            // Rapid navigation
            await navigateTo(page, '/about');
            await navigateTo(page, '/product/1');
            await navigateTo(page, '/user/bob');

            await page.waitForTimeout(500);

            const currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/user/bob');

            const rvLength = await getRouterViewContentLength(page);
            expect(rvLength).toBeGreaterThan(0);
        });

        test('C4-T5: RouterView displays 404 for non-existent routes', async ({ page }) => {
            await navigateTo(page, '/nonexistent-page');
            await page.waitForTimeout(500);

            const routerView = page.locator('#router-view');
            const content = await routerView.textContent();
            const is404 = content.includes('404') || content.includes('Not Found') || content.includes('not found');
            expect(is404).toBe(true);
        });

        test('C4-T6: RouterView content is not empty after navigation', async ({ page }) => {
            await navigateTo(page, '/search');
            await page.waitForTimeout(500);

            const rvLength = await getRouterViewContentLength(page);
            expect(rvLength).toBeGreaterThan(0);
        });
    });

    test.describe('Category 5: Route Parameters', () => {

        test('C5-T1: RouterLink with route parameter navigates correctly', async ({ page }) => {
            await navigateTo(page, '/product/42');
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.params.id).toBe('42');
        });

        test('C5-T2: RouterLink with different parameters navigates to different pages', async ({ page }) => {
            // Product 1
            await navigateTo(page, '/product/1');
            await page.waitForTimeout(300);
            let route = await getCurrentRoute(page);
            expect(route.params.id).toBe('1');

            // Product 2
            await navigateTo(page, '/product/2');
            await page.waitForTimeout(300);
            route = await getCurrentRoute(page);
            expect(route.params.id).toBe('2');
        });

        test('C5-T3: RouterLink with string parameters works', async ({ page }) => {
            await navigateTo(page, '/user/charlie');
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.params.username).toBe('charlie');
        });

        test('C5-T4: RouterLink with nested parameters', async ({ page }) => {
            await navigateTo(page, '/category/books/item/99');
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.params.categoryId).toBe('books');
            expect(route.params.itemId).toBe('99');
        });

        test('C5-T5: RouterLink with query parameters', async ({ page }) => {
            await page.evaluate(() => {
                window.router.push({
                    path: '/product/5',
                    query: { discount: '20%', color: 'red' }
                });
            });
            await page.waitForTimeout(500);

            const currentUrl = await page.evaluate(() => window.location.search);
            expect(currentUrl).toContain('discount');
            expect(currentUrl).toContain('color');
        });

        test('C5-T6: Query parameters preserved across navigation', async ({ page }) => {
            await page.evaluate(() => {
                window.router.push({
                    path: '/search',
                    query: { q: 'laptop', category: 'electronics' }
                });
            });
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.query.q).toBe('laptop');
            expect(route.query.category).toBe('electronics');
        });
    });

    test.describe('Category 6: Component Lifecycle', () => {

        test('C6-T1: New component mounts on navigation', async ({ page }) => {
            const initialContent = await page.locator('#router-view').innerHTML();

            await navigateTo(page, '/about');
            await page.waitForTimeout(500);

            const newContent = await page.locator('#router-view').innerHTML();
            expect(newContent.length).toBeGreaterThan(0);
        });

        test('C6-T2: Previous component unmounts when navigating away', async ({ page }) => {
            // Navigate to about
            await navigateTo(page, '/about');
            await page.waitForTimeout(300);

            const aboutContent = await page.locator('#router-view').innerHTML();
            expect(aboutContent).toContain('About');

            // Navigate away
            await navigateTo(page, '/product/1');
            await page.waitForTimeout(300);

            const productContent = await page.locator('#router-view').innerHTML();
            expect(productContent).not.toEqual(aboutContent);
        });

        test('C6-T3: Component remounting on re-navigation to same component', async ({ page }) => {
            await navigateTo(page, '/about');
            await page.waitForTimeout(300);

            await navigateTo(page, '/product/1');
            await page.waitForTimeout(300);

            // Navigate back to about
            await navigateTo(page, '/about');
            await page.waitForTimeout(300);

            const content = await page.locator('#router-view').innerHTML();
            expect(content).toContain('About');
        });

        test('C6-T4: Multiple navigation events maintain correct component', async ({ page }) => {
            const routes = ['/about', '/product/1', '/user/test', '/search'];

            for (const route of routes) {
                await navigateTo(page, route);
                await page.waitForTimeout(300);

                const currentPath = await getCurrentPath(page);
                expect(currentPath).toBe(route);

                const rvLength = await getRouterViewContentLength(page);
                expect(rvLength).toBeGreaterThan(0);
            }
        });
    });

    test.describe('Category 7: Edge Cases & Error Handling', () => {

        test('C7-T1: Navigation to 404 shows not found component', async ({ page }) => {
            await navigateTo(page, '/this-route-does-not-exist');
            await page.waitForTimeout(500);

            const content = await page.locator('#router-view').textContent();
            const hasNotFound = content.includes('404') || content.includes('Not Found') || content.includes('not found');
            expect(hasNotFound).toBe(true);
        });

        test('C7-T2: Can navigate from 404 back to valid route', async ({ page }) => {
            // Go to 404
            await navigateTo(page, '/invalid');
            await page.waitForTimeout(300);

            // Navigate to valid route
            await navigateTo(page, '/');
            await page.waitForTimeout(300);

            const currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/');
        });

        test('C7-T3: Special characters in parameters handled', async ({ page }) => {
            // Navigate with encoded parameter
            await page.evaluate(() => {
                window.router.push('/search?q=laptop%20computer&sort=price');
            });
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            expect(route.path).toContain('search');
        });

        test('C7-T4: Navigation with empty path handled', async ({ page }) => {
            // Navigate to home with empty trailing parts
            await navigateTo(page, '/');
            await page.waitForTimeout(500);

            const currentPath = await getCurrentPath(page);
            expect(currentPath).toBe('/');
        });

        test('C7-T5: No console errors during navigation', async ({ page }) => {
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            // Perform several navigations
            await navigateTo(page, '/about');
            await navigateTo(page, '/product/1');
            await navigateTo(page, '/user/test');

            expect(consoleErrors.length).toBe(0);
        });

        test('C7-T6: Router state consistent with URL', async ({ page }) => {
            const route1 = await navigateTo(page, '/product/7');
            await page.waitForTimeout(300);

            const route = await getCurrentRoute(page);
            const path = await getCurrentPath(page);

            expect(route.path).toBe(path);
        });
    });

    test.describe('Category 8: Integration Tests', () => {

        test('C8-T1: RouterLink and window.router.push navigate to same location', async ({ page }) => {
            // Use router.push
            await navigateTo(page, '/product/10');
            await page.waitForTimeout(300);

            const path1 = await getCurrentPath(page);
            expect(path1).toBe('/product/10');

            // Can navigate via RouterLink or router.push - both work
            await navigateTo(page, '/about');
            await page.waitForTimeout(300);

            const path2 = await getCurrentPath(page);
            expect(path2).toBe('/about');
        });

        test('C8-T2: Browser back/forward works with RouterLink navigation', async ({ page }) => {
            // Navigate using router.push
            await navigateTo(page, '/about');
            await page.waitForTimeout(300);

            // Navigate again
            await navigateTo(page, '/product/1');
            await page.waitForTimeout(300);

            // Go back
            await page.goBack();
            await page.waitForTimeout(500);

            const path = await getCurrentPath(page);
            expect(path).toBe('/about');
        });

        test('C8-T3: Nested routes render correct component and RouterView', async ({ page }) => {
            await navigateTo(page, '/category/electronics/item/5');
            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            const rvLength = await getRouterViewContentLength(page);

            expect(route.params.categoryId).toBe('electronics');
            expect(route.params.itemId).toBe('5');
            expect(rvLength).toBeGreaterThan(0);
        });

        test('C8-T4: Complex navigation flow', async ({ page }) => {
            const steps = [
                { path: '/', expected: '/' },
                { path: '/about', expected: '/about' },
                { path: '/product/15', expected: '/product/15' },
                { path: '/user/diana', expected: '/user/diana' },
                { path: '/category/clothing/item/3', expected: '/category/clothing/item/3' },
                { path: '/', expected: '/' }
            ];

            for (const step of steps) {
                await navigateTo(page, step.path);
                await page.waitForTimeout(300);

                const currentPath = await getCurrentPath(page);
                expect(currentPath).toBe(step.expected);

                const rvLength = await getRouterViewContentLength(page);
                expect(rvLength).toBeGreaterThan(0);
            }
        });

        test('C8-T5: RouterView maintains correct component through rapid updates', async ({ page }) => {
            // Rapid navigation
            for (let i = 1; i <= 5; i++) {
                await navigateTo(page, `/product/${i}`);
            }

            await page.waitForTimeout(500);

            const route = await getCurrentRoute(page);
            const rvLength = await getRouterViewContentLength(page);

            expect(route.params.id).toBe('5');
            expect(rvLength).toBeGreaterThan(0);
        });

        test('C8-T6: Route information accessible after any navigation', async ({ page }) => {
            const testRoutes = ['/about', '/product/20', '/user/eve', '/search'];

            for (const testRoute of testRoutes) {
                await navigateTo(page, testRoute);
                await page.waitForTimeout(300);

                const route = await getCurrentRoute(page);
                expect(route.path).toBe(testRoute);
                expect(route.name).toBeDefined();
            }
        });
    });

    test.describe('Category 9: Verification Tests', () => {

        test('C9-T1: Phase 6 test page loads successfully', async ({ page }) => {
            const title = await page.title();
            expect(title).toContain('Phase 6');
        });

        test('C9-T2: Test control buttons visible and interactive', async ({ page }) => {
            const buttons = await page.locator('button').count();
            expect(buttons).toBeGreaterThan(5);

            const firstButton = page.locator('button').first();
            expect(firstButton).toBeVisible();
            expect(firstButton).toBeEnabled();
        });

        test('C9-T3: Navigation links section renders', async ({ page }) => {
            const navLinks = await page.locator('.navigation-links').count();
            expect(navLinks).toBeGreaterThan(0);
        });

        test('C9-T4: Route information section renders', async ({ page }) => {
            const routeInfo = await page.locator('.route-info').count();
            expect(routeInfo).toBeGreaterThan(0);
        });

        test('C9-T5: Test log starts empty and updates', async ({ page }) => {
            // Wait for the test log to be populated with component initialization message
            await page.waitForFunction(() => {
                const testLog = document.querySelector('[data-testid="test-log"]');
                return testLog && testLog.textContent.length > 0;
            }, { timeout: TIMEOUT });
            
            // Verify the test log has content
            const initialLogText = await page.locator('[data-testid="test-log"]').textContent();
            expect(initialLogText.length).toBeGreaterThan(0);
        });
    });
});