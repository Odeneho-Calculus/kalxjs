/**
 * Reactive State Management
 * Provides reactive route and transition state objects with proper reactivity tracking
 *
 * @module composables/reactiveState
 */

import { ref, reactive } from '@kalxjs/core';

/**
 * Create a reactive route state object
 * Wraps the plain route object to make it reactive to parameter changes
 *
 * @returns {Object} Reactive route state with data ref and update methods
 */
export function createReactiveRoute() {
    const routeData = ref({
        path: '/',
        fullPath: '/',
        name: null,
        params: {},
        query: {},
        hash: '',
        matched: [],
        meta: {},
        state: {} // Location state for passing data between routes
    });

    return {
        data: routeData,

        /**
         * Update route data while preserving reactivity
         * @param {Object} newRoute - New route data to merge
         */
        update(newRoute) {
            // Shallow merge to preserve reactivity
            routeData.value = {
                ...routeData.value,
                ...newRoute,
                params: { ...newRoute.params || {} },
                query: { ...newRoute.query || {} },
                meta: { ...newRoute.meta || {} }
            };
        },

        /**
         * Update location state (for passing data between routes)
         * @param {Object} state - New state object
         */
        setState(state) {
            routeData.value.state = { ...state };
        }
    };
}

/**
 * Create a reactive transition state object
 * Tracks loading, error, and progress during navigation
 *
 * @returns {Object} Reactive transition state object
 */
export function createTransitionState() {
    return reactive({
        isLoading: false,
        isPending: false,
        error: null,
        from: null,
        to: null,
        percent: 0,
        startTime: null,
        reason: null // 'navigation' | 'preload' | null
    });
}