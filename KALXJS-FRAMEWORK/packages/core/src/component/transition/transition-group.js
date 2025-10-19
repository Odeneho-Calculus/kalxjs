/**
 * KALXJS TransitionGroup Component Implementation
 * Provides transitions for lists of elements
 * Similar to Vue 3's TransitionGroup component
 *
 * @module @kalxjs/core/component/transition
 */

import { Transition } from './transition.js';
import { nextTick } from '../../scheduler/index.js';

/**
 * TransitionGroup Component
 * Applies transitions to multiple children (typically v-for lists)
 *
 * @example
 * ```js
 * import { TransitionGroup } from '@kalxjs/core';
 *
 * // Basic list transition
 * <TransitionGroup name="list" tag="ul">
 *   <li v-for="item in items" :key="item.id">
 *     {{ item.text }}
 *   </li>
 * </TransitionGroup>
 *
 * // With move transition
 * <TransitionGroup
 *   name="list"
 *   tag="div"
 *   move-class="list-move"
 * >
 *   <div v-for="item in items" :key="item.id">
 *     {{ item.text }}
 *   </div>
 * </TransitionGroup>
 * ```
 */
export const TransitionGroup = {
    name: 'TransitionGroup',

    props: {
        // All Transition props
        ...Transition.props,

        // HTML tag to use as wrapper
        tag: {
            type: String,
            default: 'div'
        },

        // CSS class for move transitions
        moveClass: {
            type: String,
            default: null
        }
    },

    setup(props, { slots, emit }) {
        let prevChildren = [];
        const positionMap = new Map();

        /**
         * Get position of element
         */
        const getPosition = (el) => {
            const rect = el.getBoundingClientRect();
            return {
                left: rect.left,
                top: rect.top
            };
        };

        /**
         * Apply move transition to elements that changed position
         */
        const applyMoveTransition = (children) => {
            const moveClass = props.moveClass || `${props.name}-move`;

            children.forEach(child => {
                if (!child.el) return;

                const el = child.el;
                const oldPos = positionMap.get(child.key);
                const newPos = getPosition(el);

                if (oldPos && (oldPos.left !== newPos.left || oldPos.top !== newPos.top)) {
                    const dx = oldPos.left - newPos.left;
                    const dy = oldPos.top - newPos.top;

                    // Apply transform to move back to old position
                    el.style.transform = `translate(${dx}px, ${dy}px)`;
                    el.style.transitionDuration = '0s';

                    // Force reflow
                    el.offsetHeight;

                    // Add move class and remove transform
                    el.classList.add(moveClass);
                    el.style.transform = '';
                    el.style.transitionDuration = '';

                    // Remove move class after transition
                    const onEnd = () => {
                        el.classList.remove(moveClass);
                        el.removeEventListener('transitionend', onEnd);
                    };

                    el.addEventListener('transitionend', onEnd);
                }

                // Update position map
                positionMap.set(child.key, newPos);
            });
        };

        /**
         * Record positions before update
         */
        const recordPositions = (children) => {
            children.forEach(child => {
                if (child.el) {
                    positionMap.set(child.key, getPosition(child.el));
                }
            });
        };

        return () => {
            const children = slots.default?.() || [];
            const validChildren = children.filter(child => child.key != null);

            if (validChildren.length === 0) {
                return null;
            }

            // Record old positions
            recordPositions(prevChildren);

            // Create wrapper element
            const Tag = props.tag;
            const wrapperProps = {
                class: props.class,
                style: props.style
            };

            // Apply transitions to each child
            const transitionChildren = validChildren.map(child => {
                // Clone transition props
                const transitionProps = { ...props };
                delete transitionProps.tag;
                delete transitionProps.moveClass;

                // Wrap child in transition
                return {
                    ...child,
                    transition: transitionProps
                };
            });

            // Apply move transitions after render
            nextTick(() => {
                applyMoveTransition(validChildren);
            });

            prevChildren = validChildren;

            // Return wrapper with children
            return {
                tag: Tag,
                props: wrapperProps,
                children: transitionChildren
            };
        };
    }
};

/**
 * Helper to create flip animation for list reordering
 * Uses the FLIP technique (First, Last, Invert, Play)
 *
 * @param {Array} elements - Elements to animate
 * @param {number} duration - Animation duration in ms
 *
 * @example
 * ```js
 * import { useFLIPAnimation } from '@kalxjs/core';
 *
 * // In your component
 * const elements = ref([]);
 *
 * watch(items, () => {
 *   useFLIPAnimation(elements.value, 300);
 * });
 * ```
 */
export function useFLIPAnimation(elements, duration = 300) {
    if (!elements || !elements.length) return;

    // First: Record initial positions
    const firstPositions = elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
            el,
            left: rect.left,
            top: rect.top
        };
    });

    // Last: Let the browser update to final positions
    requestAnimationFrame(() => {
        // Invert: Calculate deltas
        firstPositions.forEach(({ el, left, top }) => {
            const last = el.getBoundingClientRect();
            const deltaX = left - last.left;
            const deltaY = top - last.top;

            // Play: Animate from inverted position to final position
            if (deltaX !== 0 || deltaY !== 0) {
                el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                el.style.transition = 'none';

                requestAnimationFrame(() => {
                    el.style.transform = '';
                    el.style.transition = `transform ${duration}ms`;
                });
            }
        });
    });
}

export default TransitionGroup;