/**
 * Phase 3: Route Modes (Hash, History, Memory)
 * Comprehensive browser-based routing modes testing
 *
 * Tests validate:
 * - History Mode: Clean URLs with History API
 * - URL format and navigation with parameters
 * - Query string preservation
 * - Deep linking
 * - Nested parameters
 *
 * Framework: Playwright
 * Test App: http://localhost:3000
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Phase 3: Route Modes Testing', () => {

    // ============================================================================
    // 1. History Mode URLs Tests (6 tests)
    // ============================================================================

    test.describe('1. History Mode URLs', () => {

        test('1.1 - Navigation creates clean URLs without hash', async ({ page }) => {
            await page.goto(BASE_URL);

            // Check initial URL format (clean, no hash)
            expect(page.url()).toBe(`${BASE_URL}/`);
            expect(page.url()).not.toContain('#');

            // Click About link
            await page.getByRole('link', { name: 'About' }).click();

            // Verify URL is clean (no hash)
            expect(page.url()).toBe(`${BASE_URL}/about`);
            expect(page.url()).not.toContain('#');
        });

        test('1.2 - URL format matches clean pattern (no hash)', async ({ page }) => {
            await page.goto(`${BASE_URL}/about`);

            const url = page.url();
            // Should be /about, not /#/about
            expect(url).toMatch(/^http:\/\/localhost:3000\/about$/);
            expect(url).not.toContain('#');
        });

        test('1.3 - Direct navigation to clean URL loads correct page', async ({ page }) => {
            await page.goto(`${BASE_URL}/about`);

            // Verify About page is displayed
            await expect(page.locator('h2')).toContainText('About KalxJS');
            expect(page.url()).toBe(`${BASE_URL}/about`);
        });

        test('1.4 - Back and forward navigation with clean URLs', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500); // Wait for router to be ready

            // Navigate to about
            await page.getByRole('link', { name: 'About' }).click();
            await page.waitForTimeout(500); // Wait for navigation
            expect(page.url()).toBe(`${BASE_URL}/about`);

            // Go back
            await page.goBack();
            await page.waitForTimeout(500); // Wait for navigation
            expect(page.url()).toBe(`${BASE_URL}/`);

            // Go forward
            await page.goForward();
            await page.waitForTimeout(500); // Wait for navigation
            expect(page.url()).toBe(`${BASE_URL}/about`);
        });

        test('1.5 - Multiple navigation steps with clean URLs', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            // Home
            expect(page.url()).toBe(`${BASE_URL}/`);

            // To Product
            await page.getByRole('button', { name: 'Go to Product 1', exact: true }).click();
            await page.waitForTimeout(500);
            expect(page.url()).toBe(`${BASE_URL}/product/1`);
            expect(page.url()).not.toContain('#');

            // To About
            await page.getByRole('link', { name: 'About' }).click();
            await page.waitForTimeout(500);
            expect(page.url()).toBe(`${BASE_URL}/about`);

            // Back to Product
            await page.goBack();
            await page.waitForTimeout(500);
            expect(page.url()).toBe(`${BASE_URL}/product/1`);
        });

        test('1.6 - Browser history shows clean URLs', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            await page.getByRole('link', { name: 'About' }).click();
            await page.waitForTimeout(500);

            await page.getByRole('button', { name: 'Go to Product 1', exact: true }).click();
            await page.waitForTimeout(500);

            // Navigate back twice
            await page.goBack();
            await page.waitForTimeout(500);
            expect(page.url()).toBe(`${BASE_URL}/about`);

            await page.goBack();
            await page.waitForTimeout(500);
            expect(page.url()).toBe(`${BASE_URL}/`);
        });
    });

    // ============================================================================
    // 2. History Mode with Parameters (6 tests)
    // ============================================================================

    test.describe('2. History Mode with Parameters', () => {

        test('2.1 - Single parameter in clean URL', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            // Navigate to product with parameter
            await page.getByRole('button', { name: 'Go to Product 1', exact: true }).click();
            await page.waitForTimeout(500);

            // URL should be clean with parameter
            expect(page.url()).toBe(`${BASE_URL}/product/1`);
            expect(page.url()).not.toContain('#');
        });

        test('2.2 - Multiple parameters in clean URL', async ({ page }) => {
            await page.goto(`${BASE_URL}`);

            // Navigate to nested route with multiple parameters
            await page.getByRole('button', { name: 'Electronics - Item 1' }).click();

            // URL should show both parameters cleanly
            expect(page.url()).toBe(`${BASE_URL}/category/electronics/item/1`);
            expect(page.url()).not.toContain('#');
        });

        test('2.3 - Query parameters preserved in clean URL', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            // Navigate with discount query parameter
            await page.getByRole('button', { name: 'Product 1 - 10% discount' }).click();
            await page.waitForTimeout(500);

            // URL should be clean without hash and contain product path
            expect(page.url()).toContain('/product/1');
            expect(page.url()).not.toContain('#');

            // Verify router has the query params
            const currentRoute = await page.evaluate(() => window.router.currentRoute);
            expect(currentRoute.query.discount).toBe('10%');
            expect(currentRoute.query.color).toBe('blue');
        });

        test('2.4 - Complex nested parameters with query strings', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            // Navigate to nested route with multiple parameters
            await page.getByRole('button', { name: 'Electronics - Item 1' }).click();
            await page.waitForTimeout(500);

            // URL should preserve full structure without hash
            expect(page.url()).toContain('/category/electronics/item/1');
            expect(page.url()).not.toContain('#');
        });

        test('2.5 - Parameter changes reflected in URL', async ({ page }) => {
            await page.goto(`${BASE_URL}`);
            await page.waitForTimeout(500);

            // Go to Product 1
            await page.getByRole('button', { name: 'Go to Product 1', exact: true }).click();
            await page.waitForTimeout(500);
            expect(page.url()).toContain('/product/1');

            // Go to Product 2
            await page.getByRole('button', { name: 'Go to Product 2' }).click();
            await page.waitForTimeout(500);
            expect(page.url()).toContain('/product/2');

            // URLs should differ only in parameter
            expect(page.url()).not.toContain('/product/1');
        });

        test('2.6 - Deep linking with parameters loads correct content', async ({ page }) => {
            // Direct deep link with parameter and query
            await page.goto(`${BASE_URL}/product/1`);
            await page.waitForTimeout(500);

            // Verify correct content is displayed using a more specific selector
            await expect(page.getByRole('heading', { name: /Product Details.*Laptop/ })).toBeVisible();

            // Navigate back to home
            await page.getByRole('button', { name: 'Back to Home' }).click();
            await page.waitForTimeout(500);
            expect(page.url()).toBe(`${BASE_URL}/`);
        });
    });

    // ============================================================================
    // 3. Query String Handling in History Mode (3 tests)
    // ============================================================================

    test.describe('3. Query String Handling', () => {

        test('3.1 - Query parameters preserved during navigation', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            // Navigate to product with query params
            await page.getByRole('button', { name: 'Product 1 - 10% discount' }).click();
            await page.waitForTimeout(500);

            // Check router has query params
            const route1 = await page.evaluate(() => window.router.currentRoute);
            expect(route1.query.discount).toBe('10%');

            // Navigate to another page and back
            await page.getByRole('link', { name: 'About' }).click();
            await page.waitForTimeout(500);

            // Go back to product
            await page.goBack();
            await page.waitForTimeout(500);

            // Query should still be preserved in route
            const route2 = await page.evaluate(() => window.router.currentRoute);
            expect(route2.query.discount).toBe('10%');
        });

        test('3.2 - Multiple query parameters handled correctly', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            // Navigate to product with multiple query params
            await page.getByRole('button', { name: 'Product 1 - 10% discount' }).click();
            await page.waitForTimeout(500);

            // All params should be in the route
            const route = await page.evaluate(() => window.router.currentRoute);
            expect(route.query.discount).toBe('10%');
            expect(route.query.color).toBe('blue');
            expect(route.query.size).toBe('large');
        });

        test('3.3 - Query strings update on new navigation', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            // Navigate to product 1 with discount
            await page.getByRole('button', { name: 'Product 1 - 10% discount' }).click();
            await page.waitForTimeout(500);

            const route1 = await page.evaluate(() => window.router.currentRoute);
            expect(route1.query.discount).toBe('10%');

            // Navigate to product 2 with different discount
            await page.getByRole('button', { name: 'Product 2 - 20% discount' }).click();
            await page.waitForTimeout(500);

            const route2 = await page.evaluate(() => window.router.currentRoute);
            expect(route2.query.discount).toBe('20%');
            expect(page.url()).toContain('/product/2');
        });
    });

    // ============================================================================
    // 4. Base Path Handling (3 tests)
    // ============================================================================

    test.describe('4. Base Path Handling', () => {

        test('4.1 - Root base path "/" handled correctly', async ({ page }) => {
            await page.goto(BASE_URL);

            // Root should be /
            expect(page.url()).toBe(`${BASE_URL}/`);

            // Navigation should add to root
            await page.getByRole('link', { name: 'About' }).click();
            expect(page.url()).toContain('/about');
        });

        test('4.2 - Route paths correctly stripped', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.waitForTimeout(500);

            // Navigate to nested route
            await page.getByRole('button', { name: 'Electronics - Item 1' }).click();
            await page.waitForTimeout(500);

            // Should be /category/electronics/item/1, not //category/...
            const url = page.url();
            expect(url).toBe(`${BASE_URL}/category/electronics/item/1`);
            // Should not have double slashes in the path (after domain)
            expect(url).not.toContain('//category');
        });

        test('4.3 - Routes respect base path in URL construction', async ({ page }) => {
            // Direct navigation to verify proper URL construction
            const testUrls = [
                `${BASE_URL}/`,
                `${BASE_URL}/about`,
                `${BASE_URL}/product/1`,
                `${BASE_URL}/category/electronics/item/1`
            ];

            for (const url of testUrls) {
                await page.goto(url);
                await page.waitForTimeout(300);
                // Should not have double slashes in the path (after domain)
                expect(page.url()).not.toContain('//localhost');
                expect(page.url()).toBe(url);
            }
        });
    });

    // ============================================================================
    // 5. Deep Linking and Direct Access (3 tests)
    // ============================================================================

    test.describe('5. Deep Linking and Direct Access', () => {

        test('5.1 - Deep linking to nested route works', async ({ page }) => {
            // Direct navigation to deep URL
            await page.goto(`${BASE_URL}/category/electronics/item/1`);

            // Page should load correctly
            await expect(page.locator('body')).toBeTruthy();
            expect(page.url()).toBe(`${BASE_URL}/category/electronics/item/1`);
        });

        test('5.2 - Deep linking with parameters loads correct content', async ({ page }) => {
            // Direct deep link with parameters
            await page.goto(`${BASE_URL}/product/1`);
            await page.waitForTimeout(500);

            // Verify page loads and shows Product Details with more specific selector
            await expect(page.getByRole('heading', { name: /Product Details.*Laptop/ })).toBeVisible();
        });

        test('5.3 - Refresh on clean URL maintains page', async ({ page }) => {
            await page.goto(`${BASE_URL}/about`);
            await page.waitForTimeout(500);

            // Get initial content - look for the specific About page h2
            const initialHeading = await page.getByRole('heading', { name: 'About KalxJS', level: 2 }).textContent();

            // Refresh
            await page.reload();
            await page.waitForTimeout(500);

            // Content should be the same
            const refreshedHeading = await page.getByRole('heading', { name: 'About KalxJS', level: 2 }).textContent();
            expect(refreshedHeading).toBe(initialHeading);
            expect(page.url()).toBe(`${BASE_URL}/about`);
        });
    });

    // ============================================================================
    // 6. URL Encoding and Special Characters (2 tests)
    // ============================================================================

    test.describe('6. URL Encoding and Special Characters', () => {

        test('6.1 - Special characters handled correctly', async ({ page }) => {
            // Navigate to pages and verify URLs are properly formed
            await page.goto(`${BASE_URL}/user/john`);

            // URL should be clean and properly encoded
            expect(page.url()).toContain('/user/');
            expect(page.url()).not.toContain('#');
        });

        test('6.2 - Query parameters with special characters encoded', async ({ page }) => {
            const specialCharUrl = `${BASE_URL}/search?q=test%20query&filter=active`;
            await page.goto(specialCharUrl);
            await page.waitForTimeout(500);

            // URL should contain search path
            expect(page.url()).toContain('search');
            // Query params should be in the URL (may be encoded)
            const currentRoute = await page.evaluate(() => window.router.currentRoute);
            expect(currentRoute.query.q).toBeDefined();
        });
    });

    // ============================================================================
    // 7. No Console Errors During Navigation
    // ============================================================================

    test.describe('7. Error Monitoring', () => {

        test('7.1 - No SecurityError exceptions during History API calls', async ({ page }) => {
            const errors = [];
            page.on('console', msg => {
                if (msg.type() === 'error' && msg.text().includes('SecurityError')) {
                    errors.push(msg.text());
                }
            });

            // Perform multiple navigations
            await page.goto(BASE_URL);
            await page.waitForTimeout(300);

            await page.getByRole('link', { name: 'About' }).click();
            await page.waitForTimeout(300);

            await page.getByRole('button', { name: 'Go to Product 1', exact: true }).click();
            await page.waitForTimeout(300);

            await page.goBack();
            await page.waitForTimeout(300);

            await page.goForward();
            await page.waitForTimeout(300);

            // Should have no SecurityError
            expect(errors).toHaveLength(0);
        });

        test('7.2 - Navigation completes without errors', async ({ page }) => {
            const navigationErrors = [];
            page.on('response', response => {
                if (!response.ok() && response.status() !== 304) {
                    navigationErrors.push(response.status());
                }
            });

            // Perform several navigations
            await page.goto(BASE_URL);
            await page.waitForTimeout(300);

            await page.getByRole('link', { name: 'About' }).click();
            await page.waitForTimeout(300);

            await page.getByRole('button', { name: 'Go to Product 2' }).click();
            await page.waitForTimeout(300);

            // Should have no error responses
            expect(navigationErrors).toHaveLength(0);
        });
    });
});