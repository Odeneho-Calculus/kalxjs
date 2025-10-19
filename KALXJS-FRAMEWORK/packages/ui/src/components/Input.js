/**
 * Input Component
 * Accessible form input with validation
 *
 * @module @kalxjs/ui/components/Input
 */

import { ref, computed } from '@kalxjs/core';

/**
 * Input component
 */
export function Input(props, { emit }) {
    const {
        modelValue = '',
        type = 'text',
        label = '',
        placeholder = '',
        disabled = false,
        readonly = false,
        required = false,
        error = '',
        hint = '',
        size = 'md',
        fullWidth = false,
        prefix = null,
        suffix = null,
        clearable = false,
        showPasswordToggle = false,
        maxLength = null,
        ariaLabel = null,
        ariaDescribedBy = null,
        ...attrs
    } = props;

    // Internal state
    const inputRef = ref(null);
    const isFocused = ref(false);
    const showPassword = ref(false);
    const inputId = `kalx-input-${Math.random().toString(36).slice(2, 11)}`;
    const errorId = error ? `${inputId}-error` : null;
    const hintId = hint ? `${inputId}-hint` : null;

    // Computed properties
    const inputType = computed(() => {
        if (type === 'password' && showPassword.value) {
            return 'text';
        }
        return type;
    });

    const describedBy = computed(() => {
        const ids = [ariaDescribedBy, errorId, hintId].filter(Boolean);
        return ids.length > 0 ? ids.join(' ') : null;
    });

    // Event handlers
    const handleInput = (e) => {
        emit('update:modelValue', e.target.value);
        emit('input', e.target.value);
    };

    const handleFocus = (e) => {
        isFocused.value = true;
        emit('focus', e);
    };

    const handleBlur = (e) => {
        isFocused.value = false;
        emit('blur', e);
    };

    const handleClear = () => {
        emit('update:modelValue', '');
        emit('clear');
        inputRef.value?.focus();
    };

    const togglePasswordVisibility = () => {
        showPassword.value = !showPassword.value;
    };

    // Get wrapper classes
    const wrapperClasses = computed(() => {
        const classes = ['kalx-input-wrapper'];
        if (size) classes.push(`kalx-input-wrapper--${size}`);
        if (fullWidth) classes.push('kalx-input-wrapper--full-width');
        if (error) classes.push('kalx-input-wrapper--error');
        if (disabled) classes.push('kalx-input-wrapper--disabled');
        if (isFocused.value) classes.push('kalx-input-wrapper--focused');
        return classes.join(' ');
    });

    const inputClasses = computed(() => {
        const classes = ['kalx-input'];
        if (prefix) classes.push('kalx-input--has-prefix');
        if (suffix || clearable || showPasswordToggle) classes.push('kalx-input--has-suffix');
        return classes.join(' ');
    });

    // Render
    return {
        tag: 'div',
        props: { class: wrapperClasses.value },
        children: [
            // Label
            label && {
                tag: 'label',
                props: {
                    for: inputId,
                    class: 'kalx-input-label',
                },
                children: [
                    label,
                    required && {
                        tag: 'span',
                        props: {
                            class: 'kalx-input-required',
                            'aria-label': 'required',
                        },
                        children: ['*'],
                    },
                ],
            },

            // Input container
            {
                tag: 'div',
                props: { class: 'kalx-input-container' },
                children: [
                    // Prefix
                    prefix && {
                        tag: 'span',
                        props: { class: 'kalx-input-prefix' },
                        children: [prefix],
                    },

                    // Input
                    {
                        tag: 'input',
                        ref: inputRef,
                        props: {
                            id: inputId,
                            type: inputType.value,
                            class: inputClasses.value,
                            value: modelValue,
                            placeholder,
                            disabled,
                            readonly,
                            required,
                            maxlength: maxLength,
                            'aria-label': ariaLabel || label,
                            'aria-describedby': describedBy.value,
                            'aria-invalid': !!error,
                            'aria-required': required,
                            ...attrs,
                        },
                        on: {
                            input: handleInput,
                            focus: handleFocus,
                            blur: handleBlur,
                        },
                    },

                    // Suffix actions
                    {
                        tag: 'span',
                        props: { class: 'kalx-input-suffix' },
                        children: [
                            // Clear button
                            clearable && modelValue && !disabled && {
                                tag: 'button',
                                props: {
                                    type: 'button',
                                    class: 'kalx-input-action',
                                    'aria-label': 'Clear input',
                                },
                                on: { click: handleClear },
                                children: ['×'],
                            },

                            // Password toggle
                            showPasswordToggle && type === 'password' && {
                                tag: 'button',
                                props: {
                                    type: 'button',
                                    class: 'kalx-input-action',
                                    'aria-label': showPassword.value ? 'Hide password' : 'Show password',
                                    'aria-pressed': showPassword.value,
                                },
                                on: { click: togglePasswordVisibility },
                                children: [showPassword.value ? '🙈' : '👁️'],
                            },

                            // Custom suffix
                            suffix,
                        ].filter(Boolean),
                    },
                ],
            },

            // Character count
            maxLength && {
                tag: 'div',
                props: { class: 'kalx-input-count' },
                children: [`${modelValue.length}/${maxLength}`],
            },

            // Error message
            error && {
                tag: 'p',
                props: {
                    id: errorId,
                    class: 'kalx-input-error',
                    role: 'alert',
                },
                children: [error],
            },

            // Hint message
            hint && !error && {
                tag: 'p',
                props: {
                    id: hintId,
                    class: 'kalx-input-hint',
                },
                children: [hint],
            },
        ].filter(Boolean),
    };
}

/**
 * Input styles
 */
export const inputStyles = `
.kalx-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
}

.kalx-input-wrapper--full-width {
    width: 100%;
}

.kalx-input-label {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
}

.kalx-input-required {
    color: var(--color-danger-500);
    margin-left: var(--spacing-1);
}

.kalx-input-container {
    position: relative;
    display: flex;
    align-items: center;
    background-color: var(--color-background-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
}

.kalx-input-wrapper--focused .kalx-input-container {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring-primary);
}

.kalx-input-wrapper--error .kalx-input-container {
    border-color: var(--color-danger-500);
}

.kalx-input-wrapper--disabled .kalx-input-container {
    background-color: var(--color-background-tertiary);
    opacity: 0.6;
    cursor: not-allowed;
}

.kalx-input {
    flex: 1;
    width: 100%;
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background: transparent;
    border: none;
    outline: none;
}

.kalx-input--has-prefix {
    padding-left: var(--spacing-2);
}

.kalx-input--has-suffix {
    padding-right: var(--spacing-2);
}

.kalx-input::placeholder {
    color: var(--color-text-tertiary);
}

.kalx-input-prefix,
.kalx-input-suffix {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: 0 var(--spacing-2);
    color: var(--color-text-secondary);
}

.kalx-input-action {
    padding: var(--spacing-1);
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: var(--text-lg);
    line-height: 1;
}

.kalx-input-action:hover {
    color: var(--color-text-primary);
}

.kalx-input-count {
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    text-align: right;
}

.kalx-input-error {
    font-size: var(--text-sm);
    color: var(--color-danger-500);
    margin: 0;
}

.kalx-input-hint {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
}

/* Sizes */
.kalx-input-wrapper--sm .kalx-input {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--text-sm);
}

.kalx-input-wrapper--lg .kalx-input {
    padding: var(--spacing-4) var(--spacing-5);
    font-size: var(--text-lg);
}
`;

/**
 * Export input component
 */
export default Input;