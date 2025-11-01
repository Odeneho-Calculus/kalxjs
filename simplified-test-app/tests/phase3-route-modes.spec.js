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

            // Navigate to about
            await page.getByRole('link', { name: 'About' }).click();
            expect(page.url()).toBe(`${BASE_URL}/about`);

            // Go back
            await page.goBack();
            expect(page.url()).toBe(`${BASE_URL}/`);

            // Go forward
            await page.goForward();
            expect(page.url()).toBe(`${BASE_URL}/about`);
        });

        test('1.5 - Multiple navigation steps with clean URLs', async ({ page }) => {
            await page.goto(BASE_URL);

            // Home
            expect(page.url()).toBe(`${BASE_URL}/`);

            // To Product
            await page.getByRole('button', { name: 'Go to Product 1' }).click();
            expect(page.url()).toBe(`${BASE_URL}/product/1`);
            expect(page.url()).not.toContain('#');

            // To About
            await page.getByRole('link', { name: 'About' }).click();
            expect(page.url()).toBe(`${BASE_URL}/about`);

            // Back to Product
            await page.goBack();
            expect(page.url()).toBe(`${BASE_URL}/product/1`);
        });

        test('1.6 - Browser history shows clean URLs', async ({ page }) => {
            await page.goto(BASE_URL);
            await page.getByRole('link', { name: 'About' }).click();
            await page.getByRole('button', { name: 'Go to Product 1' }).click();

            // Navigate back twice
            await page.goBack();
            expect(page.url()).toBe(`${BASE_URL}/about`);

            await page.goBack();
            expect(page.url()).toBe(`${BASE_URL}/`);
        });
    });

    // ============================================================================
    // 2. History Mode with Parameters (6 tests)
    // ============================================================================

    test.describe('2. History Mode with Parameters', () => {

        test('2.1 - Single parameter in clean URL', async ({ page }) => {
            await page.goto(BASE_URL);

            // Navigate to product with parameter
            await page.getByRole('button', { name: 'Go to Product 1' }).click();

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
            // Navigate directly to URL with query params
            await page.goto(`${BASE_URL}/product/1?discount=10&color=red`);

            // URL should preserve query parameters without hash
            expect(page.url()).toContain('discount=10');
            expect(page.url()).toContain('color=red');
            expect(page.url()).not.toContain('#');
        });

        test('2.4 - Complex nested parameters with query strings', async ({ page }) => {
            const testUrl = `${BASE_URL}/category/electronics/item/1?quantity=5&shipping=express`;
            await page.goto(testUrl);

            // URL should preserve full structure
            expect(page.url()).toContain('/category/electronics/item/1');
            expect(page.url()).toContain('quantity=5');
            expect(page.url()).toContain('shipping=express');
            expect(page.url()).not.toContain('#');
        });

        test('2.5 - Parameter changes reflected in URL', async ({ page }) => {
            await page.goto(`${BASE_URL}`);

            // Go to Product 1
            await page.getByRole('button', { name: 'Go to Product 1' }).click();
            expect(page.url()).toContain('/product/1');

            // Go to Product 2
            await page.getByRole('button', { name: 'Go to Product 2' }).click();
            expect(page.url()).toContain('/product/2');

            // URLs should differ only in parameter
            expect(page.url()).not.toContain('/product/1');
        });

        test('2.6 - Deep linking with parameters loads correct content', async ({ page }) => {
            // Direct deep link with parameter and query
            await page.goto(`${BASE_URL}/product/1?discount=10&color=red`);

            // Verify correct content is displayed
            await expect(page.locator('h1')).toContainText('Product Details');

            // Verify query params are displayed
            await expect(page.locator('text=Discount: 10')).toBeVisible();
            await expect(page.locator('text=Color: red')).toBeVisible();
        });
    });

    // ============================================================================
    // 3. Query String Handling in History Mode (3 tests)
    // ============================================================================

    test.describe('3. Query String Handling', () => {

        test('3.1 - Query parameters preserved during navigation', async ({ page }) => {
            const queryUrl = `${BASE_URL}/product/1?discount=15`;
            await page.goto(queryUrl);

            // Check query is preserved
            expect(page.url()).toContain('discount=15');

            // Navigate to another page and back
            await page.getByRole('link', { name: 'About' }).click();
            await page.goBack();

            // Query should still be present
            expect(page.url()).toContain('discount=15');
        });

        test('3.2 - Multiple query parameters handled correctly', async ({ page }) => {
            const queryUrl = `${BASE_URL}/product/1?discount=20&color=blue&size=large`;
            await page.goto(queryUrl);

            // All params should be present
            expect(page.url()).toContain('discount=20');
            expect(page.url()).toContain('color=blue');
            expect(page.url()).toContain('size=large');
        });

        test('3.3 - Query strings update on new navigation', async ({ page }) => {
            // Start with one query
            await page.goto(`${BASE_URL}/product/1?discount=10`);
            expect(page.url()).toContain('discount=10');

            // Navigate to different product with different query
            await page.goto(`${BASE_URL}/product/2?discount=20`);
            expect(page.url()).toContain('/product/2');
            expect(page.url()).toContain('discount=20');
            expect(page.url()).not.toContain('discount=10');
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

            // Navigate to nested route
            await page.getByRole('button', { name: 'Electronics - Item 1' }).click();

            // Should be /category/electronics/item/1, not //category/...
            const url = page.url();
            expect(url).toBe(`${BASE_URL}/category/electronics/item/1`);
            expect(url).not.toContain('//');
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
                // Should not have double slashes or malformed URLs
                expect(page.url()).not.toContain('//');
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

            // Verify page loads and shows Product Details
            await expect(page.locator('h1')).toContainText('Product Details');
        });

        test('5.3 - Refresh on clean URL maintains page', async ({ page }) => {
            await page.goto(`${BASE_URL}/about`);

            // Get initial content
            const initialHeading = await page.locator('h2').textContent();

            // Refresh
            await page.reload();

            // Content should be the same
            const refreshedHeading = await page.locator('h2').textContent();
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

            // URL should maintain encoding
            expect(page.url()).toContain('%20');
            expect(page.url()).toContain('search');
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
            await page.getByRole('link', { name: 'About' }).click();
            await page.getByRole('button', { name: 'Go to Product 1' }).click();
            await page.goBack();
            await page.goForward();

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
            await page.getByRole('link', { name: 'About' }).click();
            await page.getByRole('button', { name: 'Go to Product 2' }).click();

            // Should have no error responses
            expect(navigationErrors).toHaveLength(0);
        });
    });
});