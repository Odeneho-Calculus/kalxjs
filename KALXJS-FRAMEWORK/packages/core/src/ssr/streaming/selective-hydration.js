/**
 * Selective Hydration - Prioritize and hydrate components progressively
 * Improves Time to Interactive (TTI)
 */

/**
 * Hydration priorities
 */
export const HydrationPriority = {
    IMMEDIATE: 0,    // Hydrate immediately
    VISIBLE: 1,      // Hydrate when visible
    INTERACTION: 2,  // Hydrate on interaction
    IDLE: 3,         // Hydrate when browser is idle
    LAZY: 4          // Hydrate on demand
};

/**
 * Hydration queue for managing progressive hydration
 */
class HydrationQueue {
    constructor() {
        this.queue = new Map();
        this.observers = new Map();
        this.isProcessing = false;
    }

    /**
     * Adds component to hydration queue
     * @param {string} id - Component ID
     * @param {Function} hydrateFn - Hydration function
     * @param {number} priority - Hydration priority
     * @param {Object} options - Additional options
     */
    add(id, hydrateFn, priority = HydrationPriority.IDLE, options = {}) {
        this.queue.set(id, {
            id,
            hydrateFn,
            priority,
            options,
            hydrated: false
        });

        this.scheduleHydration(id, priority, options);
    }

    /**
     * Schedules hydration based on priority
     */
    scheduleHydration(id, priority, options) {
        const item = this.queue.get(id);
        if (!item || item.hydrated) return;

        switch (priority) {
            case HydrationPriority.IMMEDIATE:
                this.hydrateComponent(id);
                break;

            case HydrationPriority.VISIBLE:
                this.observeVisibility(id, options.root);
                break;

            case HydrationPriority.INTERACTION:
                this.observeInteraction(id, options.events || ['click', 'focus']);
                break;

            case HydrationPriority.IDLE:
                this.scheduleIdleHydration(id);
                break;

            case HydrationPriority.LAZY:
                // Don't hydrate until explicitly called
                break;
        }
    }

    /**
     * Observes element visibility for hydration
     */
    observeVisibility(id, root = null) {
        const element = document.querySelector(`[data-hydration-id="${id}"]`);
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.hydrateComponent(id);
                        observer.disconnect();
                    }
                });
            },
            { root, threshold: 0.01 }
        );

        observer.observe(element);
        this.observers.set(id, observer);
    }

    /**
     * Observes user interaction for hydration
     */
    observeInteraction(id, events) {
        const element = document.querySelector(`[data-hydration-id="${id}"]`);
        if (!element) return;

        const handler = () => {
            this.hydrateComponent(id);
            // Remove event listeners after hydration
            events.forEach(event => {
                element.removeEventListener(event, handler);
            });
        };

        events.forEach(event => {
            element.addEventListener(event, handler, { once: true });
        });
    }

    /**
     * Schedules hydration during browser idle time
     */
    scheduleIdleHydration(id) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.hydrateComponent(id);
            }, { timeout: 2000 });
        } else {
            // Fallback to setTimeout
            setTimeout(() => {
                this.hydrateComponent(id);
            }, 1);
        }
    }

    /**
     * Hydrates a specific component
     */
    async hydrateComponent(id) {
        const item = this.queue.get(id);
        if (!item || item.hydrated) return;

        try {
            await item.hydrateFn();
            item.hydrated = true;

            // Clean up observer if exists
            const observer = this.observers.get(id);
            if (observer) {
                observer.disconnect();
                this.observers.delete(id);
            }

            console.log(`[KALXJS] Hydrated: ${id}`);

        } catch (error) {
            console.error(`[KALXJS] Hydration error for ${id}:`, error);
        }
    }

    /**
     * Hydrates all pending components
     */
    async hydrateAll() {
        const items = Array.from(this.queue.values())
            .filter(item => !item.hydrated)
            .sort((a, b) => a.priority - b.priority);

        for (const item of items) {
            await this.hydrateComponent(item.id);
        }
    }

    /**
     * Clears the queue
     */
    clear() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.queue.clear();
    }
}

// Global hydration queue
export const hydrationQueue = new HydrationQueue();

/**
 * Marks a component for selective hydration
 * @param {string} id - Component ID
 * @param {Function} hydrateFn - Hydration function
 * @param {Object} options - Hydration options
 */
export function markForHydration(id, hydrateFn, options = {}) {
    const { priority = HydrationPriority.IDLE, ...rest } = options;
    hydrationQueue.add(id, hydrateFn, priority, rest);
}

/**
 * Manually triggers hydration for a component
 * @param {string} id - Component ID
 */
export function hydrateNow(id) {
    hydrationQueue.hydrateComponent(id);
}