/**
 * KALXJS Performance Profiler
 * Track and analyze performance metrics
 *
 * @module @kalxjs/devtools/performance-profiler
 */

import { getDevToolsHook } from './devtools-api.js';

/**
 * Performance Profiler
 */
export class PerformanceProfiler {
    constructor(hook) {
        this.hook = hook;
        this.recordings = [];
        this.isRecording = false;
        this.currentRecording = null;
        this.metrics = new Map();
    }

    /**
     * Start recording performance
     */
    startRecording(options = {}) {
        if (this.isRecording) {
            console.warn('Already recording');
            return;
        }

        this.isRecording = true;
        this.currentRecording = {
            id: `recording-${Date.now()}`,
            started: performance.now(),
            ended: null,
            events: [],
            metrics: {},
            options
        };

        // Listen to component events
        this.hook.on('component:registered', this.onComponentRegistered.bind(this));
        this.hook.on('component:updated', this.onComponentUpdated.bind(this));

        this.hook.emit('profiler:started', { recording: this.currentRecording });
    }

    /**
     * Stop recording
     */
    stopRecording() {
        if (!this.isRecording) {
            console.warn('Not recording');
            return null;
        }

        this.isRecording = false;
        this.currentRecording.ended = performance.now();
        this.currentRecording.duration =
            this.currentRecording.ended - this.currentRecording.started;

        // Calculate metrics
        this.currentRecording.metrics = this.calculateMetrics(this.currentRecording);

        // Save recording
        this.recordings.push(this.currentRecording);

        const recording = this.currentRecording;
        this.currentRecording = null;

        this.hook.emit('profiler:stopped', { recording });

        return recording;
    }

    /**
     * Handle component registered event
     */
    onComponentRegistered(data) {
        if (!this.isRecording) return;

        this.currentRecording.events.push({
            type: 'component:registered',
            timestamp: performance.now(),
            data
        });
    }

    /**
     * Handle component updated event
     */
    onComponentUpdated(data) {
        if (!this.isRecording) return;

        this.currentRecording.events.push({
            type: 'component:updated',
            timestamp: performance.now(),
            data
        });
    }

    /**
     * Record component render
     */
    recordRender(componentId, duration) {
        const metric = this.metrics.get(componentId) || {
            renders: 0,
            totalTime: 0,
            minTime: Infinity,
            maxTime: 0
        };

        metric.renders++;
        metric.totalTime += duration;
        metric.minTime = Math.min(metric.minTime, duration);
        metric.maxTime = Math.max(metric.maxTime, duration);
        metric.avgTime = metric.totalTime / metric.renders;

        this.metrics.set(componentId, metric);

        if (this.isRecording) {
            this.currentRecording.events.push({
                type: 'render',
                componentId,
                duration,
                timestamp: performance.now()
            });
        }
    }

    /**
     * Calculate metrics from recording
     */
    calculateMetrics(recording) {
        const events = recording.events;

        const metrics = {
            totalEvents: events.length,
            componentRegistrations: events.filter(e => e.type === 'component:registered').length,
            componentUpdates: events.filter(e => e.type === 'component:updated').length,
            renders: events.filter(e => e.type === 'render').length,

            // Timing metrics
            renderTimes: [],
            avgRenderTime: 0,
            maxRenderTime: 0,
            minRenderTime: Infinity,

            // Component metrics
            componentsCreated: new Set(),
            componentsUpdated: new Set(),
            slowestComponents: []
        };

        // Calculate render times
        const renderEvents = events.filter(e => e.type === 'render');
        renderEvents.forEach(event => {
            metrics.renderTimes.push(event.duration);
            metrics.maxRenderTime = Math.max(metrics.maxRenderTime, event.duration);
            metrics.minRenderTime = Math.min(metrics.minRenderTime, event.duration);

            metrics.componentsCreated.add(event.componentId);
        });

        if (metrics.renderTimes.length > 0) {
            metrics.avgRenderTime =
                metrics.renderTimes.reduce((a, b) => a + b, 0) / metrics.renderTimes.length;
        }

        // Find slowest components
        const componentTimes = new Map();
        renderEvents.forEach(event => {
            const current = componentTimes.get(event.componentId) || 0;
            componentTimes.set(event.componentId, current + event.duration);
        });

        metrics.slowestComponents = Array.from(componentTimes.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, time]) => ({ componentId: id, totalTime: time }));

        return metrics;
    }

    /**
     * Get component metrics
     */
    getComponentMetrics(componentId) {
        return this.metrics.get(componentId) || null;
    }

    /**
     * Get all metrics
     */
    getAllMetrics() {
        return Object.fromEntries(this.metrics);
    }

    /**
     * Get recordings
     */
    getRecordings() {
        return this.recordings;
    }

    /**
     * Clear recordings
     */
    clearRecordings() {
        this.recordings = [];
        this.metrics.clear();
    }

    /**
     * Export recording as JSON
     */
    exportRecording(recordingId) {
        const recording = this.recordings.find(r => r.id === recordingId);
        if (!recording) return null;

        return JSON.stringify(recording, null, 2);
    }

    /**
     * Analyze performance issues
     */
    analyzePerformance(recording) {
        const issues = [];
        const metrics = recording.metrics;

        // Check for slow renders
        if (metrics.maxRenderTime > 16) {
            issues.push({
                severity: 'warning',
                type: 'slow-render',
                message: `Slow render detected: ${metrics.maxRenderTime.toFixed(2)}ms (target: <16ms)`,
                details: metrics.slowestComponents
            });
        }

        // Check for excessive updates
        if (metrics.componentUpdates > metrics.componentRegistrations * 5) {
            issues.push({
                severity: 'warning',
                type: 'excessive-updates',
                message: `High update frequency: ${metrics.componentUpdates} updates for ${metrics.componentRegistrations} components`,
                ratio: metrics.componentUpdates / metrics.componentRegistrations
            });
        }

        // Check for memory leaks (components not cleaned up)
        const stillMounted = this.hook.getComponents().length;
        if (stillMounted > metrics.componentsCreated.size * 0.8) {
            issues.push({
                severity: 'info',
                type: 'potential-memory-leak',
                message: `Many components still mounted: ${stillMounted} / ${metrics.componentsCreated.size}`
            });
        }

        return issues;
    }
}

/**
 * Create performance profiler
 */
export function createProfiler() {
    const hook = getDevToolsHook();
    if (!hook) {
        console.warn('DevTools hook not found');
        return null;
    }

    return new PerformanceProfiler(hook);
}

export default { PerformanceProfiler, createProfiler };