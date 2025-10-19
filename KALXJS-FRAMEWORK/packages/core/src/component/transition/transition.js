/**
 * KALXJS Transition Component Implementation
 * Provides smooth transitions when elements are inserted/removed from the DOM
 * Similar to Vue 3's Transition component
 *
 * @module @kalxjs/core/component/transition
 */

import { getCurrentInstance } from '../component.js';
import { nextTick } from '../../scheduler/index.js';

/**
 * CSS class names for transition phases
 */
const transitionPhases = {
    ENTER: 'enter',
    ENTER_FROM: 'enter-from',
    ENTER_ACTIVE: 'enter-active',
    ENTER_TO: 'enter-to',
    LEAVE: 'leave',
    LEAVE_FROM: 'leave-from',
    LEAVE_ACTIVE: 'leave-active',
    LEAVE_TO: 'leave-to'
};

/**
 * Transition Component
 * Applies CSS transitions/animations when child elements enter/leave the DOM
 *
 * @example
 * ```js
 * import { Transition } from '@kalxjs/core';
 *
 * // Basic transition
 * <Transition name="fade">
 *   <div v-if="show">Hello</div>
 * </Transition>
 *
 * // With custom classes
 * <Transition
 *   enter-active-class="animated fadeIn"
 *   leave-active-class="animated fadeOut"
 * >
 *   <div v-if="show">Hello</div>
 * </Transition>
 *
 * // With JavaScript hooks
 * <Transition
 *   @before-enter="onBeforeEnter"
 *   @enter="onEnter"
 *   @after-enter="onAfterEnter"
 *   @before-leave="onBeforeLeave"
 *   @leave="onLeave"
 *   @after-leave="onAfterLeave"
 * >
 *   <div v-if="show">Hello</div>
 * </Transition>
 * ```
 */
export const Transition = {
    name: 'Transition',

    props: {
        // Transition name for auto-generating CSS classes
        name: {
            type: String,
            default: 'v'
        },

        // Custom transition classes
        enterFromClass: String,
        enterActiveClass: String,
        enterToClass: String,
        leaveFromClass: String,
        leaveActiveClass: String,
        leaveToClass: String,

        // Transition mode: 'in-out' | 'out-in' | 'default'
        mode: {
            type: String,
            default: 'default',
            validator: (value) => ['default', 'in-out', 'out-in'].includes(value)
        },

        // Appear transition on initial render
        appear: {
            type: Boolean,
            default: false
        },

        // Custom appear classes
        appearFromClass: String,
        appearActiveClass: String,
        appearToClass: String,

        // Transition duration (ms)
        duration: {
            type: [Number, Object],
            default: null
        },

        // CSS transition mode
        type: {
            type: String,
            validator: (value) => ['transition', 'animation'].includes(value)
        },

        // Whether to use CSS
        css: {
            type: Boolean,
            default: true
        }
    },

    setup(props, { slots, emit }) {
        const instance = getCurrentInstance();
        let prevChild = null;
        let isInitialRender = true;

        /**
         * Get CSS class name for a transition phase
         */
        const getClassName = (phase, custom) => {
            if (custom) return custom;
            return `${props.name}-${phase}`;
        };

        /**
         * Resolve transition duration
         */
        const getDuration = (type) => {
            const { duration } = props;
            if (duration == null) return null;
            if (typeof duration === 'number') return duration;
            return duration[type];
        };

        /**
         * Add CSS classes to element
         */
        const addClasses = (el, classes) => {
            classes.forEach(cls => cls && el.classList.add(cls));
        };

        /**
         * Remove CSS classes from element
         */
        const removeClasses = (el, classes) => {
            classes.forEach(cls => cls && el.classList.remove(cls));
        };

        /**
         * Get transition/animation end event name
         */
        const getTransitionEndEvent = (el) => {
            const transitions = {
                'transition': 'transitionend',
                'OTransition': 'oTransitionEnd',
                'MozTransition': 'transitionend',
                'WebkitTransition': 'webkitTransitionEnd'
            };

            for (let t in transitions) {
                if (el.style[t] !== undefined) {
                    return transitions[t];
                }
            }

            return 'transitionend';
        };

        /**
         * Perform enter transition
         */
        const performEnter = (el, isAppear = false) => {
            const prefix = isAppear ? 'appear' : 'enter';

            const fromClass = getClassName(`${prefix}-from`, props[`${prefix}FromClass`]);
            const activeClass = getClassName(`${prefix}-active`, props[`${prefix}ActiveClass`]);
            const toClass = getClassName(`${prefix}-to`, props[`${prefix}ToClass`]);

            // Before enter
            emit(`before-${prefix}`, el);

            // Add initial classes
            addClasses(el, [fromClass, activeClass]);

            // Force reflow
            el.offsetHeight;

            // Next frame
            nextTick(() => {
                removeClasses(el, [fromClass]);
                addClasses(el, [toClass]);

                emit(prefix, el, () => {
                    // Transition done callback
                    removeClasses(el, [activeClass, toClass]);
                    emit(`after-${prefix}`, el);
                });

                // Auto-detect transition end
                if (props.css) {
                    const duration = getDuration('enter');
                    const endEvent = getTransitionEndEvent(el);

                    const onEnd = () => {
                        removeClasses(el, [activeClass, toClass]);
                        emit(`after-${prefix}`, el);
                        el.removeEventListener(endEvent, onEnd);
                    };

                    if (duration) {
                        setTimeout(onEnd, duration);
                    } else {
                        el.addEventListener(endEvent, onEnd);
                    }
                }
            });
        };

        /**
         * Perform leave transition
         */
        const performLeave = (el, remove) => {
            const fromClass = getClassName('leave-from', props.leaveFromClass);
            const activeClass = getClassName('leave-active', props.leaveActiveClass);
            const toClass = getClassName('leave-to', props.leaveToClass);

            // Before leave
            emit('before-leave', el);

            // Add initial classes
            addClasses(el, [fromClass, activeClass]);

            // Force reflow
            el.offsetHeight;

            // Next frame
            nextTick(() => {
                removeClasses(el, [fromClass]);
                addClasses(el, [toClass]);

                emit('leave', el, () => {
                    // Transition done callback
                    removeClasses(el, [activeClass, toClass]);
                    emit('after-leave', el);
                    remove();
                });

                // Auto-detect transition end
                if (props.css) {
                    const duration = getDuration('leave');
                    const endEvent = getTransitionEndEvent(el);

                    const onEnd = () => {
                        removeClasses(el, [activeClass, toClass]);
                        emit('after-leave', el);
                        remove();
                        el.removeEventListener(endEvent, onEnd);
                    };

                    if (duration) {
                        setTimeout(onEnd, duration);
                    } else {
                        el.addEventListener(endEvent, onEnd);
                    }
                } else {
                    remove();
                }
            });
        };

        return () => {
            const children = slots.default?.();

            if (!children || !children.length) {
                return null;
            }

            if (children.length > 1) {
                console.warn('[KALXJS] Transition should contain exactly one child element');
            }

            const child = children[0];
            const currentChild = child;

            // Handle initial render with appear
            if (isInitialRender && props.appear) {
                isInitialRender = false;

                // Apply appear transition
                if (currentChild.el) {
                    performEnter(currentChild.el, true);
                }
            } else {
                isInitialRender = false;
            }

            // Handle mode transitions
            if (prevChild && prevChild.key !== currentChild.key) {
                if (props.mode === 'out-in') {
                    // Leave old, then enter new
                    if (prevChild.el) {
                        performLeave(prevChild.el, () => {
                            if (currentChild.el) {
                                performEnter(currentChild.el);
                            }
                        });
                    }
                } else if (props.mode === 'in-out') {
                    // Enter new, then leave old
                    if (currentChild.el) {
                        performEnter(currentChild.el);
                    }
                    if (prevChild.el) {
                        performLeave(prevChild.el, () => { });
                    }
                } else {
                    // Default: simultaneous
                    if (prevChild.el) {
                        performLeave(prevChild.el, () => { });
                    }
                    if (currentChild.el) {
                        performEnter(currentChild.el);
                    }
                }
            } else if (!prevChild && currentChild.el) {
                // First render
                performEnter(currentChild.el);
            }

            prevChild = currentChild;

            return child;
        };
    }
};

export default Transition;