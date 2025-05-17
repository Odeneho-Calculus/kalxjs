// @kalxjs/core - Animation system

/**
 * Animation easing functions
 */
export const EASING = {
    LINEAR: t => t,
    EASE_IN: t => t * t,
    EASE_OUT: t => t * (2 - t),
    EASE_IN_OUT: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    ELASTIC: t => t === 0 ? 0 : t === 1 ? 1 : (t < 0.5
        ? 0.5 * Math.sin(13 * Math.PI * t) * Math.pow(2, 10 * (2 * t - 1))
        : 0.5 * Math.sin(-13 * Math.PI * t) * Math.pow(2, -10 * (2 * t - 1)) + 1),
    BOUNCE: t => {
        const a = 7.5625;
        const b = 2.75;

        if (t < 1 / b) {
            return a * t * t;
        } else if (t < 2 / b) {
            return a * (t -= 1.5 / b) * t + 0.75;
        } else if (t < 2.5 / b) {
            return a * (t -= 2.25 / b) * t + 0.9375;
        } else {
            return a * (t -= 2.625 / b) * t + 0.984375;
        }
    }
};

/**
 * Animation directions
 */
export const DIRECTION = {
    NORMAL: 'normal',
    REVERSE: 'reverse',
    ALTERNATE: 'alternate',
    ALTERNATE_REVERSE: 'alternate-reverse'
};

/**
 * Animation fill modes
 */
export const FILL_MODE = {
    NONE: 'none',
    FORWARDS: 'forwards',
    BACKWARDS: 'backwards',
    BOTH: 'both'
};

/**
 * Creates an animation timeline
 * @param {Object} options - Timeline options
 * @returns {Object} Animation timeline
 */
export function createTimeline(options = {}) {
    const {
        duration = 1000,
        delay = 0,
        easing = EASING.LINEAR,
        iterations = 1,
        direction = DIRECTION.NORMAL,
        fillMode = FILL_MODE.NONE,
        autoplay = false,
        onStart = null,
        onUpdate = null,
        onComplete = null
    } = options;

    // Timeline state
    const state = reactive({
        isPlaying: false,
        isPaused: false,
        isCompleted: false,
        currentTime: 0,
        progress: 0,
        iteration: 0
    });

    // Animation tracks
    const tracks = [];

    // Animation frame request ID
    let animationFrameId = null;

    // Start time
    let startTime = 0;

    // Pause time
    let pauseTime = 0;

    /**
     * Adds a track to the timeline
     * @param {Object} track - Animation track
     * @returns {Object} Animation timeline
     */
    const add = (track) => {
        tracks.push(track);
        return timeline;
    };

    /**
     * Starts the timeline
     * @returns {Object} Animation timeline
     */
    const play = () => {
        if (state.isPlaying && !state.isPaused) {
            return timeline;
        }

        if (state.isPaused) {
            // Resume from pause
            state.isPaused = false;
            startTime = performance.now() - pauseTime;
        } else {
            // Start from beginning
            state.isPlaying = true;
            state.isCompleted = false;
            state.currentTime = 0;
            state.progress = 0;
            state.iteration = 0;

            startTime = performance.now() + delay;

            // Call onStart callback
            if (onStart) {
                onStart();
            }
        }

        // Start animation loop
        animationFrameId = requestAnimationFrame(update);

        return timeline;
    };

    /**
     * Pauses the timeline
     * @returns {Object} Animation timeline
     */
    const pause = () => {
        if (!state.isPlaying || state.isPaused) {
            return timeline;
        }

        state.isPaused = true;
        pauseTime = state.currentTime;

        // Stop animation loop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        return timeline;
    };

    /**
     * Stops the timeline
     * @param {boolean} goToEnd - Whether to go to the end of the animation
     * @returns {Object} Animation timeline
     */
    const stop = (goToEnd = false) => {
        if (!state.isPlaying) {
            return timeline;
        }

        state.isPlaying = false;
        state.isPaused = false;

        // Stop animation loop
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (goToEnd) {
            // Go to the end of the animation
            state.currentTime = duration;
            state.progress = 1;
            state.iteration = iterations;
            state.isCompleted = true;

            // Update tracks
            updateTracks(1);

            // Call onComplete callback
            if (onComplete) {
                onComplete();
            }
        } else {
            // Reset animation
            state.currentTime = 0;
            state.progress = 0;
            state.iteration = 0;
            state.isCompleted = false;

            // Update tracks
            updateTracks(0);
        }

        return timeline;
    };

    /**
     * Seeks to a specific time in the timeline
     * @param {number} time - Time to seek to
     * @returns {Object} Animation timeline
     */
    const seek = (time) => {
        time = Math.max(0, Math.min(time, duration));

        state.currentTime = time;
        state.progress = time / duration;

        // Update tracks
        updateTracks(state.progress);

        return timeline;
    };

    /**
     * Updates the timeline
     * @param {number} timestamp - Current timestamp
     */
    const update = (timestamp) => {
        if (!state.isPlaying || state.isPaused) {
            return;
        }

        // Calculate current time
        let currentTime = timestamp - startTime;

        // Handle delay
        if (currentTime < 0) {
            animationFrameId = requestAnimationFrame(update);
            return;
        }

        // Calculate progress
        let progress = currentTime / duration;
        let iteration = Math.floor(progress);

        // Handle iterations
        if (iterations !== Infinity) {
            if (iteration >= iterations) {
                // Animation completed
                progress = 1;
                iteration = iterations - 1;
                state.isCompleted = true;
                state.isPlaying = false;
            } else {
                // Animation still running
                progress = progress % 1;
            }
        } else {
            // Infinite animation
            progress = progress % 1;
        }

        // Handle direction
        let effectiveProgress = progress;

        switch (direction) {
            case DIRECTION.REVERSE:
                effectiveProgress = 1 - progress;
                break;

            case DIRECTION.ALTERNATE:
                if (iteration % 2 === 1) {
                    effectiveProgress = 1 - progress;
                }
                break;

            case DIRECTION.ALTERNATE_REVERSE:
                if (iteration % 2 === 0) {
                    effectiveProgress = 1 - progress;
                }
                break;
        }

        // Apply easing
        effectiveProgress = easing(effectiveProgress);

        // Update state
        state.currentTime = currentTime;
        state.progress = effectiveProgress;
        state.iteration = iteration;

        // Update tracks
        updateTracks(effectiveProgress);

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(effectiveProgress, currentTime);
        }

        // Continue animation loop or complete
        if (state.isCompleted) {
            // Call onComplete callback
            if (onComplete) {
                onComplete();
            }
        } else {
            animationFrameId = requestAnimationFrame(update);
        }
    };

    /**
     * Updates all tracks
     * @param {number} progress - Current progress
     */
    const updateTracks = (progress) => {
        for (const track of tracks) {
            track.update(progress);
        }
    };

    // Create timeline object
    const timeline = {
        state,
        add,
        play,
        pause,
        stop,
        seek
    };

    // Start automatically if autoplay is enabled
    if (autoplay) {
        play();
    }

    return timeline;
}

/**
 * Creates an animation track
 * @param {Object} target - Target object
 * @param {string} property - Property to animate
 * @param {Array} keyframes - Animation keyframes
 * @param {Object} options - Track options
 * @returns {Object} Animation track
 */
export function createTrack(target, property, keyframes, options = {}) {
    const {
        easing = EASING.LINEAR,
        interpolate = defaultInterpolate
    } = options;

    // Sort keyframes by time
    keyframes.sort((a, b) => a.time - b.time);

    // Ensure keyframes span from 0 to 1
    if (keyframes[0].time !== 0) {
        keyframes.unshift({ time: 0, value: keyframes[0].value });
    }

    if (keyframes[keyframes.length - 1].time !== 1) {
        keyframes.push({ time: 1, value: keyframes[keyframes.length - 1].value });
    }

    /**
     * Updates the track
     * @param {number} progress - Current progress
     */
    const update = (progress) => {
        // Find the keyframes that bracket the current progress
        let startFrame = keyframes[0];
        let endFrame = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
            if (progress >= keyframes[i].time && progress <= keyframes[i + 1].time) {
                startFrame = keyframes[i];
                endFrame = keyframes[i + 1];
                break;
            }
        }

        // Calculate local progress between the two keyframes
        const localProgress = (progress - startFrame.time) / (endFrame.time - startFrame.time);

        // Apply easing to local progress
        const easedProgress = easing(localProgress);

        // Interpolate between the two keyframe values
        const value = interpolate(startFrame.value, endFrame.value, easedProgress);

        // Update the target property
        if (typeof target === 'function') {
            target(value);
        } else if (typeof property === 'function') {
            property(target, value);
        } else if (target && property) {
            if (property.includes('.')) {
                // Handle nested properties
                const parts = property.split('.');
                let current = target;

                for (let i = 0; i < parts.length - 1; i++) {
                    current = current[parts[i]];

                    if (!current) {
                        return;
                    }
                }

                current[parts[parts.length - 1]] = value;
            } else {
                // Handle direct properties
                target[property] = value;
            }
        }
    };

    return {
        update
    };
}

/**
 * Default interpolation function
 * @param {any} start - Start value
 * @param {any} end - End value
 * @param {number} progress - Current progress
 * @returns {any} Interpolated value
 */
function defaultInterpolate(start, end, progress) {
    // Handle numbers
    if (typeof start === 'number' && typeof end === 'number') {
        return start + (end - start) * progress;
    }

    // Handle colors
    if (isColor(start) && isColor(end)) {
        return interpolateColor(start, end, progress);
    }

    // Handle arrays
    if (Array.isArray(start) && Array.isArray(end)) {
        return interpolateArray(start, end, progress);
    }

    // Handle objects
    if (isObject(start) && isObject(end)) {
        return interpolateObject(start, end, progress);
    }

    // Handle strings
    if (typeof start === 'string' && typeof end === 'string') {
        // Check if strings are numbers
        const startNum = parseFloat(start);
        const endNum = parseFloat(end);

        if (!isNaN(startNum) && !isNaN(endNum)) {
            const result = startNum + (endNum - startNum) * progress;

            // Preserve original format
            if (start.endsWith('px')) {
                return `${result}px`;
            } else if (start.endsWith('%')) {
                return `${result}%`;
            } else if (start.endsWith('em')) {
                return `${result}em`;
            } else if (start.endsWith('rem')) {
                return `${result}rem`;
            } else if (start.endsWith('vw')) {
                return `${result}vw`;
            } else if (start.endsWith('vh')) {
                return `${result}vh`;
            } else if (start.endsWith('deg')) {
                return `${result}deg`;
            } else if (start.endsWith('rad')) {
                return `${result}rad`;
            } else if (start.endsWith('turn')) {
                return `${result}turn`;
            } else if (start.endsWith('s')) {
                return `${result}s`;
            } else if (start.endsWith('ms')) {
                return `${result}ms`;
            }

            return result.toString();
        }

        // For non-numeric strings, just return the end value at the end
        return progress < 1 ? start : end;
    }

    // For other types, just return the end value at the end
    return progress < 1 ? start : end;
}

/**
 * Checks if a value is a color
 * @param {any} value - Value to check
 * @returns {boolean} Whether the value is a color
 */
function isColor(value) {
    if (typeof value !== 'string') {
        return false;
    }

    // Check for hex color
    if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
        return true;
    }

    // Check for rgb/rgba color
    if (/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(value) ||
        /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(value)) {
        return true;
    }

    // Check for hsl/hsla color
    if (/^hsl\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)$/i.test(value) ||
        /^hsla\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+\s*\)$/i.test(value)) {
        return true;
    }

    // Check for named color
    const namedColors = [
        'transparent', 'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure',
        'beige', 'bisque', 'black', 'blanchedalmond', 'blue', 'blueviolet', 'brown',
        'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue',
        'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod',
        'darkgray', 'darkgreen', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
        'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
        'darkslateblue', 'darkslategray', 'darkturquoise', 'darkviolet', 'deeppink',
        'deepskyblue', 'dimgray', 'dodgerblue', 'firebrick', 'floralwhite',
        'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
        'gray', 'green', 'greenyellow', 'honeydew', 'hotpink', 'indianred', 'indigo',
        'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon',
        'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray',
        'lightgreen', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue',
        'lightslategray', 'lightsteelblue', 'lightyellow', 'lime', 'limegreen',
        'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid',
        'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
        'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose',
        'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
        'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
        'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum',
        'powderblue', 'purple', 'rebeccapurple', 'red', 'rosybrown', 'royalblue',
        'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna',
        'silver', 'skyblue', 'slateblue', 'slategray', 'snow', 'springgreen',
        'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet',
        'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'
    ];

    return namedColors.includes(value.toLowerCase());
}

/**
 * Interpolates between two colors
 * @param {string} start - Start color
 * @param {string} end - End color
 * @param {number} progress - Current progress
 * @returns {string} Interpolated color
 */
function interpolateColor(start, end, progress) {
    // Convert colors to RGB
    const startRGB = parseColor(start);
    const endRGB = parseColor(end);

    // Interpolate RGB values
    const r = Math.round(startRGB.r + (endRGB.r - startRGB.r) * progress);
    const g = Math.round(startRGB.g + (endRGB.g - startRGB.g) * progress);
    const b = Math.round(startRGB.b + (endRGB.b - startRGB.b) * progress);
    const a = startRGB.a + (endRGB.a - startRGB.a) * progress;

    // Return color in the same format as the end color
    if (end.startsWith('#')) {
        return rgbToHex(r, g, b);
    } else if (end.startsWith('rgba')) {
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    } else if (end.startsWith('rgb')) {
        return `rgb(${r}, ${g}, ${b})`;
    } else if (end.startsWith('hsla')) {
        const hsla = rgbToHsl(r, g, b, a);
        return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a})`;
    } else if (end.startsWith('hsl')) {
        const hsl = rgbToHsl(r, g, b);
        return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }

    return rgbToHex(r, g, b);
}

/**
 * Parses a color string to RGB values
 * @param {string} color - Color string
 * @returns {Object} RGB values
 */
function parseColor(color) {
    // Handle hex color
    if (color.startsWith('#')) {
        return hexToRgb(color);
    }

    // Handle rgb/rgba color
    if (color.startsWith('rgb')) {
        const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i);

        if (match) {
            return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: match[4] ? parseFloat(match[4]) : 1
            };
        }
    }

    // Handle hsl/hsla color
    if (color.startsWith('hsl')) {
        const match = color.match(/hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/i);

        if (match) {
            return hslToRgb(
                parseInt(match[1], 10),
                parseFloat(match[2]),
                parseFloat(match[3]),
                match[4] ? parseFloat(match[4]) : 1
            );
        }
    }

    // Handle named color
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;

    return {
        r: data[0],
        g: data[1],
        b: data[2],
        a: data[3] / 255
    };
}

/**
 * Converts hex color to RGB
 * @param {string} hex - Hex color
 * @returns {Object} RGB values
 */
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 1
    } : { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Converts RGB to hex color
 * @param {number} r - Red component
 * @param {number} g - Green component
 * @param {number} b - Blue component
 * @returns {string} Hex color
 */
function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Converts HSL to RGB
 * @param {number} h - Hue
 * @param {number} s - Saturation
 * @param {number} l - Lightness
 * @param {number} a - Alpha
 * @returns {Object} RGB values
 */
function hslToRgb(h, s, l, a = 1) {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        a
    };
}

/**
 * Converts RGB to HSL
 * @param {number} r - Red component
 * @param {number} g - Green component
 * @param {number} b - Blue component
 * @param {number} a - Alpha
 * @returns {Object} HSL values
 */
function rgbToHsl(r, g, b, a = 1) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
        a
    };
}

/**
 * Interpolates between two arrays
 * @param {Array} start - Start array
 * @param {Array} end - End array
 * @param {number} progress - Current progress
 * @returns {Array} Interpolated array
 */
function interpolateArray(start, end, progress) {
    const result = [];
    const length = Math.max(start.length, end.length);

    for (let i = 0; i < length; i++) {
        const startValue = i < start.length ? start[i] : start[start.length - 1];
        const endValue = i < end.length ? end[i] : end[end.length - 1];

        result.push(defaultInterpolate(startValue, endValue, progress));
    }

    return result;
}

/**
 * Checks if a value is an object
 * @param {any} value - Value to check
 * @returns {boolean} Whether the value is an object
 */
function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Interpolates between two objects
 * @param {Object} start - Start object
 * @param {Object} end - End object
 * @param {number} progress - Current progress
 * @returns {Object} Interpolated object
 */
function interpolateObject(start, end, progress) {
    const result = {};

    // Interpolate properties from start object
    for (const key in start) {
        if (key in end) {
            result[key] = defaultInterpolate(start[key], end[key], progress);
        } else {
            result[key] = start[key];
        }
    }

    // Add properties from end object that are not in start object
    for (const key in end) {
        if (!(key in start)) {
            result[key] = end[key];
        }
    }

    return result;
}

/**
 * Creates a spring animation
 * @param {Object} options - Spring options
 * @returns {Object} Spring animation
 */
export function createSpring(options = {}) {
    const {
        stiffness = 100,
        damping = 10,
        mass = 1,
        initialVelocity = 0,
        precision = 0.01,
        onUpdate = null,
        onComplete = null
    } = options;

    // Spring state
    const state = reactive({
        value: 0,
        target: 0,
        velocity: initialVelocity,
        isAnimating: false
    });

    // Animation frame request ID
    let animationFrameId = null;

    // Last time
    let lastTime = 0;

    /**
     * Sets the target value
     * @param {number} target - Target value
     * @returns {Object} Spring animation
     */
    const setTarget = (target) => {
        state.target = target;

        if (!state.isAnimating) {
            state.isAnimating = true;
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(update);
        }

        return spring;
    };

    /**
     * Sets the current value
     * @param {number} value - Current value
     * @returns {Object} Spring animation
     */
    const setValue = (value) => {
        state.value = value;

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(state.value);
        }

        return spring;
    };

    /**
     * Updates the spring
     * @param {number} timestamp - Current timestamp
     */
    const update = (timestamp) => {
        if (!state.isAnimating) {
            return;
        }

        // Calculate delta time
        const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        // Calculate spring force
        const springForce = stiffness * (state.target - state.value);
        const dampingForce = damping * state.velocity;
        const force = (springForce - dampingForce) / mass;

        // Update velocity and position
        state.velocity += force * deltaTime;
        state.value += state.velocity * deltaTime;

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(state.value);
        }

        // Check if animation is complete
        if (Math.abs(state.velocity) < precision && Math.abs(state.target - state.value) < precision) {
            state.value = state.target;
            state.velocity = 0;
            state.isAnimating = false;

            // Call onUpdate callback one last time
            if (onUpdate) {
                onUpdate(state.value);
            }

            // Call onComplete callback
            if (onComplete) {
                onComplete();
            }

            return;
        }

        // Continue animation loop
        animationFrameId = requestAnimationFrame(update);
    };

    /**
     * Stops the spring animation
     * @returns {Object} Spring animation
     */
    const stop = () => {
        if (state.isAnimating) {
            state.isAnimating = false;

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        return spring;
    };

    // Create spring object
    const spring = {
        state,
        setTarget,
        setValue,
        stop
    };

    return spring;
}

/**
 * Creates a physics-based animation
 * @param {Object} options - Physics options
 * @returns {Object} Physics animation
 */
export function createPhysics(options = {}) {
    const {
        gravity = 9.8,
        friction = 0.1,
        bounce = 0.5,
        mass = 1,
        initialVelocity = { x: 0, y: 0 },
        initialPosition = { x: 0, y: 0 },
        bounds = { x: { min: -Infinity, max: Infinity }, y: { min: -Infinity, max: Infinity } },
        onUpdate = null,
        onCollision = null
    } = options;

    // Physics state
    const state = reactive({
        position: { ...initialPosition },
        velocity: { ...initialVelocity },
        isAnimating: false
    });

    // Animation frame request ID
    let animationFrameId = null;

    // Last time
    let lastTime = 0;

    /**
     * Starts the physics animation
     * @returns {Object} Physics animation
     */
    const start = () => {
        if (!state.isAnimating) {
            state.isAnimating = true;
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(update);
        }

        return physics;
    };

    /**
     * Stops the physics animation
     * @returns {Object} Physics animation
     */
    const stop = () => {
        if (state.isAnimating) {
            state.isAnimating = false;

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        return physics;
    };

    /**
     * Applies a force to the object
     * @param {Object} force - Force vector
     * @returns {Object} Physics animation
     */
    const applyForce = (force) => {
        state.velocity.x += force.x / mass;
        state.velocity.y += force.y / mass;

        return physics;
    };

    /**
     * Sets the position of the object
     * @param {Object} position - Position vector
     * @returns {Object} Physics animation
     */
    const setPosition = (position) => {
        state.position = { ...position };

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(state.position, state.velocity);
        }

        return physics;
    };

    /**
     * Sets the velocity of the object
     * @param {Object} velocity - Velocity vector
     * @returns {Object} Physics animation
     */
    const setVelocity = (velocity) => {
        state.velocity = { ...velocity };

        return physics;
    };

    /**
     * Updates the physics
     * @param {number} timestamp - Current timestamp
     */
    const update = (timestamp) => {
        if (!state.isAnimating) {
            return;
        }

        // Calculate delta time
        const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        // Apply gravity
        state.velocity.y += gravity * deltaTime;

        // Apply friction
        state.velocity.x *= (1 - friction * deltaTime);
        state.velocity.y *= (1 - friction * deltaTime);

        // Update position
        state.position.x += state.velocity.x * deltaTime;
        state.position.y += state.velocity.y * deltaTime;

        // Check bounds
        let collided = false;

        if (state.position.x < bounds.x.min) {
            state.position.x = bounds.x.min;
            state.velocity.x = -state.velocity.x * bounce;
            collided = true;
        } else if (state.position.x > bounds.x.max) {
            state.position.x = bounds.x.max;
            state.velocity.x = -state.velocity.x * bounce;
            collided = true;
        }

        if (state.position.y < bounds.y.min) {
            state.position.y = bounds.y.min;
            state.velocity.y = -state.velocity.y * bounce;
            collided = true;
        } else if (state.position.y > bounds.y.max) {
            state.position.y = bounds.y.max;
            state.velocity.y = -state.velocity.y * bounce;
            collided = true;
        }

        // Call onCollision callback
        if (collided && onCollision) {
            onCollision(state.position, state.velocity);
        }

        // Call onUpdate callback
        if (onUpdate) {
            onUpdate(state.position, state.velocity);
        }

        // Continue animation loop
        animationFrameId = requestAnimationFrame(update);
    };

    // Create physics object
    const physics = {
        state,
        start,
        stop,
        applyForce,
        setPosition,
        setVelocity
    };

    return physics;
}

/**
 * Creates an animation plugin for KalxJS
 * @returns {Object} Animation plugin
 */
export function createAnimationPlugin() {
    return {
        name: 'animation',
        install(app) {
            // Add animation utilities to the app
            app.config = app.config || {};
            app.config.globalProperties = app.config.globalProperties || {};
            app.config.globalProperties.$animation = {
                createTimeline,
                createTrack,
                createSpring,
                createPhysics,
                EASING,
                DIRECTION,
                FILL_MODE
            };

            // Add animation utilities to the window
            if (typeof window !== 'undefined') {
                window.$kalxjs = window.$kalxjs || {};
                window.$kalxjs.animation = {
                    createTimeline,
                    createTrack,
                    createSpring,
                    createPhysics,
                    EASING,
                    DIRECTION,
                    FILL_MODE
                };
            }

            // Register animation components
            app.component('Transition', {
                props: {
                    name: String,
                    appear: Boolean,
                    mode: String,
                    duration: [Number, Object],
                    easing: [String, Function],
                    onBeforeEnter: Function,
                    onEnter: Function,
                    onAfterEnter: Function,
                    onEnterCancelled: Function,
                    onBeforeLeave: Function,
                    onLeave: Function,
                    onAfterLeave: Function,
                    onLeaveCancelled: Function
                },
                setup(props, { slots }) {
                    // Implementation of transition component
                    return () => {
                        const children = slots.default ? slots.default() : [];
                        return children;
                    };
                }
            });

            app.component('TransitionGroup', {
                props: {
                    tag: {
                        type: String,
                        default: 'div'
                    },
                    moveClass: String,
                    name: String,
                    appear: Boolean,
                    duration: [Number, Object],
                    easing: [String, Function]
                },
                setup(props, { slots }) {
                    // Implementation of transition group component
                    return () => {
                        const children = slots.default ? slots.default() : [];
                        return h(props.tag, {}, children);
                    };
                }
            });

            app.component('AnimatedValue', {
                props: {
                    value: {
                        required: true
                    },
                    duration: {
                        type: Number,
                        default: 300
                    },
                    easing: {
                        type: [String, Function],
                        default: 'ease-in-out'
                    },
                    spring: {
                        type: Boolean,
                        default: false
                    },
                    stiffness: {
                        type: Number,
                        default: 100
                    },
                    damping: {
                        type: Number,
                        default: 10
                    },
                    precision: {
                        type: Number,
                        default: 0.01
                    }
                },
                setup(props, { slots }) {
                    const currentValue = ref(props.value);
                    let animation = null;

                    // Watch for value changes
                    watch(() => props.value, (newValue) => {
                        if (props.spring) {
                            // Use spring animation
                            if (!animation) {
                                animation = createSpring({
                                    stiffness: props.stiffness,
                                    damping: props.damping,
                                    precision: props.precision,
                                    onUpdate: (value) => {
                                        currentValue.value = value;
                                    }
                                });
                            }

                            animation.setTarget(newValue);
                        } else {
                            // Use timeline animation
                            if (animation) {
                                animation.stop();
                            }

                            const startValue = currentValue.value;

                            animation = createTimeline({
                                duration: props.duration,
                                easing: typeof props.easing === 'string' ? EASING[props.easing.toUpperCase()] || EASING.LINEAR : props.easing
                            });

                            animation.add(createTrack(
                                (value) => { currentValue.value = value; },
                                null,
                                [
                                    { time: 0, value: startValue },
                                    { time: 1, value: newValue }
                                ]
                            ));

                            animation.play();
                        }
                    }, { immediate: true });

                    // Clean up on unmount
                    onUnmounted(() => {
                        if (animation) {
                            animation.stop();
                        }
                    });

                    return () => {
                        // Default slot with current value
                        if (slots.default) {
                            return slots.default(currentValue.value);
                        }

                        // Default rendering
                        return h('span', {}, [currentValue.value.toString()]);
                    };
                }
            });
        }
    };
}