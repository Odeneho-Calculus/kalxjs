/**
 * Metrics Collector
 * Collects and normalizes performance metrics
 */

export class MetricsCollector {
    constructor() {
        this.metrics = new Map();
        this.startTimes = new Map();
    }

    /**
     * Start timing a metric
     */
    startTiming(label) {
        this.startTimes.set(label, performance.now());
    }

    /**
     * End timing and record metric
     */
    endTiming(label) {
        const startTime = this.startTimes.get(label);
        if (!startTime) {
            throw new Error(`No start time found for ${label}`);
        }

        const duration = performance.now() - startTime;
        this.recordMetric(label, duration);
        this.startTimes.delete(label);

        return duration;
    }

    /**
     * Record a metric value
     */
    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push(value);
    }

    /**
     * Get statistics for a metric
     */
    getStats(name) {
        const values = this.metrics.get(name) || [];
        if (values.length === 0) {
            return null;
        }

        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        // Calculate standard deviation
        const variance = values.reduce((sum, val) => {
            return sum + Math.pow(val - mean, 2);
        }, 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Percentiles
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];

        return {
            name,
            count: values.length,
            mean: parseFloat(mean.toFixed(2)),
            median: parseFloat(median.toFixed(2)),
            min: parseFloat(min.toFixed(2)),
            max: parseFloat(max.toFixed(2)),
            stdDev: parseFloat(stdDev.toFixed(2)),
            p95: parseFloat(p95.toFixed(2)),
            p99: parseFloat(p99.toFixed(2))
        };
    }

    /**
     * Get all statistics
     */
    getAllStats() {
        const stats = {};
        for (const [name] of this.metrics) {
            stats[name] = this.getStats(name);
        }
        return stats;
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics.clear();
        this.startTimes.clear();
    }

    /**
     * Memory metrics
     */
    recordMemory(label) {
        if (typeof performance.memory !== 'undefined') {
            const memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
            this.recordMetric(`${label}.usedHeap`, memory.usedJSHeapSize);
            this.recordMetric(`${label}.totalHeap`, memory.totalJSHeapSize);
            return memory;
        }
        return null;
    }

    /**
     * Export metrics to JSON
     */
    toJSON() {
        return {
            timestamp: new Date().toISOString(),
            stats: this.getAllStats(),
            raw: Object.fromEntries(this.metrics)
        };
    }
}

export default MetricsCollector;