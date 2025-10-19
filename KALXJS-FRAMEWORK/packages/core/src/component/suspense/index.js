/**
 * Suspense - Export all suspense-related functionality
 */

export { Suspense } from './suspense.js';
export {
    createSuspenseBoundary,
    pushSuspenseBoundary,
    popSuspenseBoundary,
    getCurrentSuspenseBoundary,
    trackPromise,
    onSuspenseEvent
} from './suspense-context.js';

/**
 * Composition API hook for suspense
 * @param {Function} asyncFn - Async function to execute
 * @returns {Object} Suspense state
 */
import { ref } from '../../reactivity/reactive.js';
import { trackPromise } from './suspense-context.js';

export function useSuspense(asyncFn) {
    const data = ref(null);
    const error = ref(null);
    const loading = ref(false);

    const execute = async (...args) => {
        loading.value = true;
        error.value = null;

        const promise = asyncFn(...args)
            .then(result => {
                data.value = result;
                return result;
            })
            .catch(err => {
                error.value = err;
                throw err;
            })
            .finally(() => {
                loading.value = false;
            });

        return trackPromise(promise);
    };

    return {
        data,
        error,
        loading,
        execute
    };
}