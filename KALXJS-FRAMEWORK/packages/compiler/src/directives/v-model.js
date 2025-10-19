/**
 * v-model Directive - Two-way data binding
 * Supports input, textarea, select, and custom components
 */

/**
 * Compiles v-model directive
 * @param {Object} node - AST node
 * @param {string} binding - Model binding expression
 * @param {Object} modifiers - Directive modifiers
 * @returns {Object} Compiled directive
 */
export function compileVModel(node, binding, modifiers = {}) {
    const tag = node.tag?.toLowerCase();

    // Determine element type
    if (tag === 'input') {
        return compileInputVModel(node, binding, modifiers);
    } else if (tag === 'textarea') {
        return compileTextareaVModel(node, binding, modifiers);
    } else if (tag === 'select') {
        return compileSelectVModel(node, binding, modifiers);
    } else {
        return compileComponentVModel(node, binding, modifiers);
    }
}

/**
 * Compiles v-model for input elements
 */
function compileInputVModel(node, binding, modifiers) {
    const type = node.props?.type || 'text';
    const { lazy, number, trim } = modifiers;

    // Event to listen to
    const event = lazy ? 'change' : 'input';

    // Value transformation
    let valueExpression = `$event.target.value`;

    if (trim) {
        valueExpression = `${valueExpression}.trim()`;
    }

    if (number) {
        valueExpression = `parseFloat(${valueExpression}) || 0`;
    }

    // Special handling for different input types
    switch (type) {
        case 'checkbox':
            return {
                props: {
                    checked: `${binding}`,
                    [`on${event}`]: `(e) => { ${binding} = e.target.checked; }`
                }
            };

        case 'radio':
            return {
                props: {
                    checked: `${binding} === ${node.props?.value || '""'}`,
                    [`on${event}`]: `(e) => { if(e.target.checked) ${binding} = ${node.props?.value || '""'}; }`
                }
            };

        default:
            return {
                props: {
                    value: `${binding}`,
                    [`on${event}`]: `(e) => { ${binding} = ${valueExpression}; }`
                }
            };
    }
}

/**
 * Compiles v-model for textarea
 */
function compileTextareaVModel(node, binding, modifiers) {
    const { lazy, trim } = modifiers;
    const event = lazy ? 'change' : 'input';

    let valueExpression = `$event.target.value`;
    if (trim) {
        valueExpression = `${valueExpression}.trim()`;
    }

    return {
        props: {
            value: `${binding}`,
            [`on${event}`]: `(e) => { ${binding} = ${valueExpression}; }`
        }
    };
}

/**
 * Compiles v-model for select
 */
function compileSelectVModel(node, binding, modifiers) {
    const { number } = modifiers;
    const isMultiple = node.props?.multiple !== undefined;

    let valueExpression;

    if (isMultiple) {
        valueExpression = `Array.from($event.target.selectedOptions).map(o => ${number ? 'parseFloat(o.value) || o.value' : 'o.value'})`;
    } else {
        valueExpression = number
            ? `parseFloat($event.target.value) || 0`
            : `$event.target.value`;
    }

    return {
        props: {
            value: `${binding}`,
            onchange: `(e) => { ${binding} = ${valueExpression}; }`
        }
    };
}

/**
 * Compiles v-model for custom components
 */
function compileComponentVModel(node, binding, modifiers) {
    const prop = modifiers.prop || 'modelValue';
    const event = modifiers.event || 'update:modelValue';

    return {
        props: {
            [prop]: `${binding}`,
            [`on${capitalize(event)}`]: `(value) => { ${binding} = value; }`
        }
    };
}

/**
 * Capitalizes first letter
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates runtime v-model code
 * @param {string} binding - Binding expression
 * @param {Object} modifiers - Modifiers
 * @returns {string} Runtime code
 */
export function generateVModelCode(binding, modifiers) {
    return `
        vModel: {
            get: () => ${binding},
            set: (value) => { ${binding} = value; },
            modifiers: ${JSON.stringify(modifiers)}
        }
    `;
}