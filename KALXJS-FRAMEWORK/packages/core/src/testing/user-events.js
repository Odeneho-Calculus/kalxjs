/**
 * User Event Simulation
 * Simulate real user interactions for testing
 *
 * @module @kalxjs/testing/user-events
 */

/**
 * Wait for next frame
 */
function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

/**
 * Wait for element to be available
 */
async function waitForElement(selector, container = document, timeout = 1000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        const element = typeof selector === 'string'
            ? container.querySelector(selector)
            : selector;

        if (element) {
            return element;
        }

        await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error(`Element not found: ${selector}`);
}

/**
 * Click element
 */
export async function click(target, options = {}) {
    const element = await waitForElement(target);
    const { button = 0, ctrlKey = false, shiftKey = false, metaKey = false } = options;

    // Focus element
    if (element.focus) {
        element.focus();
    }

    // Mouse down
    element.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        button,
        ctrlKey,
        shiftKey,
        metaKey,
    }));

    await nextFrame();

    // Mouse up
    element.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        button,
        ctrlKey,
        shiftKey,
        metaKey,
    }));

    // Click
    element.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button,
        ctrlKey,
        shiftKey,
        metaKey,
    }));

    await nextFrame();
}

/**
 * Double click element
 */
export async function dblClick(target, options = {}) {
    await click(target, options);
    await click(target, options);

    const element = await waitForElement(target);
    element.dispatchEvent(new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        ...options,
    }));

    await nextFrame();
}

/**
 * Type text into element
 */
export async function type(target, text, options = {}) {
    const element = await waitForElement(target);
    const { delay = 0 } = options;

    // Focus element
    element.focus();
    element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

    for (const char of text) {
        // Key down
        element.dispatchEvent(new KeyboardEvent('keydown', {
            key: char,
            bubbles: true,
            cancelable: true,
        }));

        // Key press
        element.dispatchEvent(new KeyboardEvent('keypress', {
            key: char,
            bubbles: true,
            cancelable: true,
        }));

        // Update value
        if (element.value !== undefined) {
            element.value += char;
        }

        // Input event
        element.dispatchEvent(new InputEvent('input', {
            data: char,
            bubbles: true,
            cancelable: true,
        }));

        // Key up
        element.dispatchEvent(new KeyboardEvent('keyup', {
            key: char,
            bubbles: true,
            cancelable: true,
        }));

        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        await nextFrame();
    }
}

/**
 * Clear input element
 */
export async function clear(target) {
    const element = await waitForElement(target);

    element.focus();

    if (element.value !== undefined) {
        element.value = '';
        element.dispatchEvent(new InputEvent('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    await nextFrame();
}

/**
 * Select option(s) from select element
 */
export async function selectOptions(target, values) {
    const element = await waitForElement(target);
    const valuesArray = Array.isArray(values) ? values : [values];

    Array.from(element.options).forEach(option => {
        option.selected = valuesArray.includes(option.value) || valuesArray.includes(option.textContent);
    });

    element.dispatchEvent(new Event('change', { bubbles: true }));
    await nextFrame();
}

/**
 * Upload file(s) to input element
 */
export async function upload(target, files) {
    const element = await waitForElement(target);
    const fileList = Array.isArray(files) ? files : [files];

    // Create FileList
    const dataTransfer = new DataTransfer();
    fileList.forEach(file => dataTransfer.items.add(file));

    element.files = dataTransfer.files;
    element.dispatchEvent(new Event('change', { bubbles: true }));

    await nextFrame();
}

/**
 * Hover over element
 */
export async function hover(target) {
    const element = await waitForElement(target);

    element.dispatchEvent(new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
    }));

    element.dispatchEvent(new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
    }));

    await nextFrame();
}

/**
 * Unhover element
 */
export async function unhover(target) {
    const element = await waitForElement(target);

    element.dispatchEvent(new MouseEvent('mouseout', {
        bubbles: true,
        cancelable: true,
    }));

    element.dispatchEvent(new MouseEvent('mouseleave', {
        bubbles: true,
        cancelable: true,
    }));

    await nextFrame();
}

/**
 * Press keyboard key
 */
export async function keyboard(key, options = {}) {
    const {
        ctrlKey = false,
        shiftKey = false,
        altKey = false,
        metaKey = false,
    } = options;

    const activeElement = document.activeElement;

    // Key down
    activeElement.dispatchEvent(new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
        ctrlKey,
        shiftKey,
        altKey,
        metaKey,
    }));

    await nextFrame();

    // Key up
    activeElement.dispatchEvent(new KeyboardEvent('keyup', {
        key,
        bubbles: true,
        cancelable: true,
        ctrlKey,
        shiftKey,
        altKey,
        metaKey,
    }));

    await nextFrame();
}

/**
 * Tab to next focusable element
 */
export async function tab(options = {}) {
    const { shift = false } = options;
    await keyboard('Tab', { shiftKey: shift });
}

/**
 * Focus element
 */
export async function focus(target) {
    const element = await waitForElement(target);

    element.focus();
    element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

    await nextFrame();
}

/**
 * Blur element
 */
export async function blur(target) {
    const element = await waitForElement(target);

    element.blur();
    element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

    await nextFrame();
}

/**
 * Paste text into element
 */
export async function paste(target, text) {
    const element = await waitForElement(target);

    element.focus();

    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);

    element.dispatchEvent(new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData,
    }));

    if (element.value !== undefined) {
        element.value += text;
        element.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }

    await nextFrame();
}

/**
 * Drag and drop
 */
export async function dragAndDrop(source, target) {
    const sourceElement = await waitForElement(source);
    const targetElement = await waitForElement(target);

    const dataTransfer = new DataTransfer();

    // Drag start
    sourceElement.dispatchEvent(new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
    }));

    await nextFrame();

    // Drag enter
    targetElement.dispatchEvent(new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
    }));

    await nextFrame();

    // Drag over
    targetElement.dispatchEvent(new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
    }));

    await nextFrame();

    // Drop
    targetElement.dispatchEvent(new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
    }));

    await nextFrame();

    // Drag end
    sourceElement.dispatchEvent(new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
    }));

    await nextFrame();
}

/**
 * Scroll element
 */
export async function scroll(target, position) {
    const element = await waitForElement(target);

    if (typeof position === 'number') {
        element.scrollTop = position;
    } else if (position && typeof position === 'object') {
        if ('top' in position) {
            element.scrollTop = position.top;
        }
        if ('left' in position) {
            element.scrollLeft = position.left;
        }
    }

    element.dispatchEvent(new Event('scroll', { bubbles: true }));

    await nextFrame();
}

/**
 * Create user event utilities bound to a container
 */
export function createUserEvent(container = document) {
    return {
        click: (target, options) => click(target, options),
        dblClick: (target, options) => dblClick(target, options),
        type: (target, text, options) => type(target, text, options),
        clear: (target) => clear(target),
        selectOptions: (target, values) => selectOptions(target, values),
        upload: (target, files) => upload(target, files),
        hover: (target) => hover(target),
        unhover: (target) => unhover(target),
        keyboard: (key, options) => keyboard(key, options),
        tab: (options) => tab(options),
        focus: (target) => focus(target),
        blur: (target) => blur(target),
        paste: (target, text) => paste(target, text),
        dragAndDrop: (source, target) => dragAndDrop(source, target),
        scroll: (target, position) => scroll(target, position),
    };
}