/**
 * Browser Runner
 * Utilities for running benchmarks in browser environments
 */

import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';

export class BrowserRunner {
    constructor(options = {}) {
        this.options = {
            headless: options.headless ?? true,
            viewport: options.viewport ?? { width: 1920, height: 1080 },
            throttling: options.throttling ?? { cpu: 4, network: '4G' },
            ...options
        };
        this.browser = null;
        this.page = null;
    }

    /**
     * Launch browser
     */
    async launch() {
        this.browser = await puppeteer.launch({
            headless: this.options.headless,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport(this.options.viewport);

        return this.page;
    }

    /**
     * Navigate to URL and wait for load
     */
    async navigate(url, waitUntil = 'networkidle2') {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        await this.page.goto(url, { waitUntil });
    }

    /**
     * Execute function in browser context
     */
    async evaluate(fn, ...args) {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        return await this.page.evaluate(fn, ...args);
    }

    /**
     * Get performance metrics
     */
    async getPerformanceMetrics() {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        const metrics = await this.page.evaluate(() => {
            const perfData = window.performance.getEntriesByType('navigation')[0];
            const paintData = window.performance.getEntriesByType('paint');

            return {
                navigation: {
                    dns: perfData.domainLookupEnd - perfData.domainLookupStart,
                    tcp: perfData.connectEnd - perfData.connectStart,
                    request: perfData.responseStart - perfData.requestStart,
                    response: perfData.responseEnd - perfData.responseStart,
                    domParsing: perfData.domInteractive - perfData.domLoading,
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    loadComplete: perfData.loadEventEnd - perfData.loadEventStart
                },
                paint: {
                    fcp: paintData.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                    fp: paintData.find(p => p.name === 'first-paint')?.startTime || 0
                },
                timing: {
                    domInteractive: perfData.domInteractive,
                    domComplete: perfData.domComplete,
                    loadComplete: perfData.loadEventEnd
                }
            };
        });

        return metrics;
    }

    /**
     * Get memory metrics
     */
    async getMemoryMetrics() {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        const metrics = await this.page.metrics();

        return {
            jsHeapSize: metrics.JSHeapUsedSize,
            totalHeapSize: metrics.JSHeapTotalSize,
            heapLimit: metrics.JSHeapSizeLimit,
            documents: metrics.Documents,
            frames: metrics.Frames,
            nodes: metrics.Nodes,
            layoutCount: metrics.LayoutCount,
            styleCount: metrics.RecalcStyleCount
        };
    }

    /**
     * Run Lighthouse audit
     */
    async runLighthouse(url) {
        const { lhr } = await lighthouse(url, {
            port: new URL(this.browser.wsEndpoint()).port,
            output: 'json',
            onlyCategories: ['performance'],
        });

        return {
            performance: lhr.categories.performance.score * 100,
            metrics: {
                fcp: lhr.audits['first-contentful-paint'].numericValue,
                lcp: lhr.audits['largest-contentful-paint'].numericValue,
                tti: lhr.audits['interactive'].numericValue,
                tbt: lhr.audits['total-blocking-time'].numericValue,
                cls: lhr.audits['cumulative-layout-shift'].numericValue,
                si: lhr.audits['speed-index'].numericValue
            }
        };
    }

    /**
     * Measure rendering time
     */
    async measureRender(items) {
        const startTime = await this.evaluate(() => performance.now());

        await this.evaluate((itemCount) => {
            // Trigger render with items
            window.triggerRender && window.triggerRender(itemCount);
        }, items);

        await this.page.waitForFunction(() => {
            return window.renderComplete === true;
        }, { timeout: 30000 });

        const endTime = await this.evaluate(() => performance.now());

        return endTime - startTime;
    }

    /**
     * Simulate user interaction
     */
    async simulateInteraction(selector, type = 'click') {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        await this.page.waitForSelector(selector);

        switch (type) {
            case 'click':
                await this.page.click(selector);
                break;
            case 'type':
                await this.page.type(selector, 'test input');
                break;
            case 'hover':
                await this.page.hover(selector);
                break;
            default:
                throw new Error(`Unknown interaction type: ${type}`);
        }
    }

    /**
     * Take screenshot
     */
    async screenshot(path) {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        await this.page.screenshot({ path, fullPage: true });
    }

    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }

    /**
     * Get bundle size from network requests
     */
    async getBundleSize() {
        if (!this.page) {
            throw new Error('Browser not launched. Call launch() first.');
        }

        const resources = await this.evaluate(() => {
            const entries = performance.getEntriesByType('resource');
            return entries
                .filter(e => e.initiatorType === 'script' || e.initiatorType === 'link')
                .map(e => ({
                    url: e.name,
                    type: e.initiatorType,
                    size: e.transferSize,
                    encodedSize: e.encodedBodySize,
                    decodedSize: e.decodedBodySize
                }));
        });

        const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
        const jsSize = resources
            .filter(r => r.type === 'script')
            .reduce((sum, r) => sum + r.size, 0);
        const cssSize = resources
            .filter(r => r.type === 'link')
            .reduce((sum, r) => sum + r.size, 0);

        return {
            total: totalSize,
            js: jsSize,
            css: cssSize,
            resources
        };
    }
}

export default BrowserRunner;