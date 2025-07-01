// @kalxjs/compiler - Advanced Template Compiler for KalxJS
// Professional-grade template compiler with comprehensive k-directive support

/**
 * Advanced Template Compiler for KalxJS templates
 * Converts templates with k-directives into optimized render functions
 */
export class AdvancedTemplateCompiler {
    constructor(options = {}) {
        this.options = {
            optimizeStaticNodes: true,
            generateSourceMap: true,
            preserveWhitespace: false,
            strictMode: true,
            ...options
        };

        this.errors = [];
        this.warnings = [];
        this.staticNodes = [];
        this.dynamicNodes = [];
        this.hoistedNodes = [];
        this.imports = new Set();
        this.helpers = new Set();
    }

    /**
     * Compile a template string into a render function
     * @param {string} template - Template string
     * @param {Object} options - Compilation options
     * @returns {Object} Compiled template result
     */
    compile(template, options = {}) {
        this.reset();
        const mergedOptions = { ...this.options, ...options };

        try {
            // Parse template into AST
            const ast = this.parseTemplate(template);

            // Transform AST with directive processing
            const transformedAST = this.transformAST(ast);

            // Generate render function code
            const renderCode = this.generateRenderFunction(transformedAST, mergedOptions);

            // Generate helper imports
            const imports = this.generateImports();

            return {
                code: renderCode,
                imports,
                ast: transformedAST,
                staticNodes: this.staticNodes,
                errors: this.errors,
                warnings: this.warnings,
                sourceMap: mergedOptions.generateSourceMap ? this.generateSourceMap() : null
            };
        } catch (error) {
            this.addError(`Template compilation failed: ${error.message}`);

            return {
                code: this.generateErrorRenderFunction(error),
                imports: ['import { h } from "@kalxjs/core";'],
                ast: null,
                staticNodes: [],
                errors: this.errors,
                warnings: this.warnings,
                sourceMap: null
            };
        }
    }

    /**
     * Reset compiler state
     * @private
     */
    reset() {
        this.errors = [];
        this.warnings = [];
        this.staticNodes = [];
        this.dynamicNodes = [];
        this.hoistedNodes = [];
        this.imports.clear();
        this.helpers.clear();
    }

    /**
     * Parse template string into AST
     * @private
     * @param {string} template - Template string
     * @returns {Object} Template AST
     */
    parseTemplate(template) {
        // Create a simple DOM-like structure for parsing
        const parser = this.createTemplateParser();
        return parser.parse(template);
    }

    /**
     * Create template parser
     * @private
     * @returns {Object} Template parser
     */
    createTemplateParser() {
        return {
            parse: (template) => {
                // Enhanced template parsing with proper tag matching
                const root = { type: 'root', children: [] };
                const stack = [root];
                let current = 0;

                // Tokenize the template
                const tokens = this.tokenizeTemplate(template);

                // Build AST from tokens
                for (const token of tokens) {
                    this.processToken(token, stack);
                }

                return root;
            }
        };
    }

    /**
     * Tokenize template into manageable tokens
     * @private
     * @param {string} template - Template string
     * @returns {Array} Array of tokens
     */
    tokenizeTemplate(template) {
        const tokens = [];
        let current = 0;

        while (current < template.length) {
            // Skip whitespace if not preserving
            if (!this.options.preserveWhitespace && /\s/.test(template[current])) {
                current++;
                continue;
            }

            // Handle opening tags
            if (template[current] === '<' && template[current + 1] !== '/') {
                const tagMatch = template.slice(current).match(/^<([a-zA-Z][a-zA-Z0-9-]*)\s*([^>]*)>/);
                if (tagMatch) {
                    const [fullMatch, tagName, attributes] = tagMatch;
                    tokens.push({
                        type: 'openTag',
                        tagName,
                        attributes: this.parseAttributes(attributes),
                        raw: fullMatch,
                        start: current,
                        end: current + fullMatch.length
                    });
                    current += fullMatch.length;
                    continue;
                }
            }

            // Handle closing tags
            if (template[current] === '<' && template[current + 1] === '/') {
                const closeMatch = template.slice(current).match(/^<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>/);
                if (closeMatch) {
                    const [fullMatch, tagName] = closeMatch;
                    tokens.push({
                        type: 'closeTag',
                        tagName,
                        raw: fullMatch,
                        start: current,
                        end: current + fullMatch.length
                    });
                    current += fullMatch.length;
                    continue;
                }
            }

            // Handle interpolations {{ }}
            if (template[current] === '{' && template[current + 1] === '{') {
                const interpMatch = template.slice(current).match(/^\{\{([^}]*)\}\}/);
                if (interpMatch) {
                    const [fullMatch, expression] = interpMatch;
                    tokens.push({
                        type: 'interpolation',
                        expression: expression.trim(),
                        raw: fullMatch,
                        start: current,
                        end: current + fullMatch.length
                    });
                    current += fullMatch.length;
                    continue;
                }
            }

            // Handle text content
            let textEnd = current;
            while (textEnd < template.length &&
                template[textEnd] !== '<' &&
                !(template[textEnd] === '{' && template[textEnd + 1] === '{')) {
                textEnd++;
            }

            if (textEnd > current) {
                const text = template.slice(current, textEnd);
                if (text.trim() || this.options.preserveWhitespace) {
                    tokens.push({
                        type: 'text',
                        content: text,
                        start: current,
                        end: textEnd
                    });
                }
                current = textEnd;
            } else {
                current++;
            }
        }

        return tokens;
    }

    /**
     * Process a single token and update the AST stack
     * @private
     * @param {Object} token - Token to process
     * @param {Array} stack - AST stack
     */
    processToken(token, stack) {
        const parent = stack[stack.length - 1];

        switch (token.type) {
            case 'openTag':
                const element = {
                    type: 'element',
                    tagName: token.tagName,
                    attributes: token.attributes,
                    children: [],
                    directives: this.extractDirectives(token.attributes),
                    start: token.start,
                    end: token.end
                };

                parent.children.push(element);

                // Check if it's a self-closing tag
                if (!this.isSelfClosingTag(token.tagName) && !token.raw.endsWith('/>')) {
                    stack.push(element);
                }
                break;

            case 'closeTag':
                if (stack.length > 1) {
                    const current = stack.pop();
                    if (current.tagName !== token.tagName) {
                        this.addWarning(`Mismatched closing tag: expected </${current.tagName}>, got </${token.tagName}>`);
                    }
                }
                break;

            case 'text':
                if (token.content.trim()) {
                    parent.children.push({
                        type: 'text',
                        content: token.content,
                        start: token.start,
                        end: token.end
                    });
                }
                break;

            case 'interpolation':
                parent.children.push({
                    type: 'interpolation',
                    expression: token.expression,
                    start: token.start,
                    end: token.end
                });
                break;
        }
    }

    /**
     * Extract directives from attributes
     * @private
     * @param {Object} attributes - Element attributes
     * @returns {Array} Array of directive objects
     */
    extractDirectives(attributes) {
        const directives = [];

        for (const [name, value] of Object.entries(attributes)) {
            // Handle k-directives
            if (name.startsWith('k-')) {
                const directiveName = name.slice(2);
                const [directive, arg] = directiveName.split(':');

                directives.push({
                    name: directive,
                    arg,
                    value,
                    modifiers: this.parseModifiers(name),
                    raw: name
                });
            }
            // Handle shorthand directives
            else if (name.startsWith(':')) {
                directives.push({
                    name: 'bind',
                    arg: name.slice(1),
                    value,
                    modifiers: [],
                    raw: name
                });
            }
            else if (name.startsWith('@')) {
                directives.push({
                    name: 'on',
                    arg: name.slice(1),
                    value,
                    modifiers: [],
                    raw: name
                });
            }
        }

        return directives;
    }

    /**
     * Parse directive modifiers
     * @private
     * @param {string} directiveName - Full directive name
     * @returns {Array} Array of modifiers
     */
    parseModifiers(directiveName) {
        const parts = directiveName.split('.');
        return parts.slice(1); // Skip the directive name itself
    }

    /**
     * Transform AST with directive processing
     * @private
     * @param {Object} ast - Template AST
     * @returns {Object} Transformed AST
     */
    transformAST(ast) {
        return this.transformNode(ast);
    }

    /**
     * Transform a single AST node
     * @private
     * @param {Object} node - AST node
     * @returns {Object} Transformed node
     */
    transformNode(node) {
        if (!node) return node;

        switch (node.type) {
            case 'root':
                return {
                    ...node,
                    children: node.children.map(child => this.transformNode(child))
                };

            case 'element':
                return this.transformElement(node);

            case 'text':
                return this.transformText(node);

            case 'interpolation':
                return this.transformInterpolation(node);

            default:
                return node;
        }
    }

    /**
     * Transform element node with directive processing
     * @private
     * @param {Object} element - Element node
     * @returns {Object} Transformed element
     */
    transformElement(element) {
        const transformed = { ...element };

        // Process directives in order of priority
        const sortedDirectives = this.sortDirectivesByPriority(element.directives);

        // Apply directive transformations
        for (const directive of sortedDirectives) {
            this.applyDirectiveTransform(transformed, directive);
        }

        // Transform children
        transformed.children = element.children.map(child => this.transformNode(child));

        // Check if node can be hoisted (static optimization)
        if (this.options.optimizeStaticNodes && this.isStaticNode(transformed)) {
            this.staticNodes.push(transformed);
            transformed.isStatic = true;
            transformed.hoistId = this.staticNodes.length;
        }

        return transformed;
    }

    /**
     * Transform text node
     * @private
     * @param {Object} textNode - Text node
     * @returns {Object} Transformed text node
     */
    transformText(textNode) {
        return {
            ...textNode,
            isStatic: true
        };
    }

    /**
     * Transform interpolation node
     * @private
     * @param {Object} interpNode - Interpolation node
     * @returns {Object} Transformed interpolation node
     */
    transformInterpolation(interpNode) {
        this.helpers.add('toDisplayString');

        return {
            ...interpNode,
            isDynamic: true,
            helper: 'toDisplayString'
        };
    }

    /**
     * Sort directives by processing priority
     * @private
     * @param {Array} directives - Array of directives
     * @returns {Array} Sorted directives
     */
    sortDirectivesByPriority(directives) {
        const priority = {
            'for': 1000,
            'if': 900,
            'else-if': 800,
            'else': 700,
            'show': 600,
            'model': 500,
            'bind': 400,
            'on': 300,
            'slot': 200,
            'text': 100,
            'html': 100
        };

        return [...directives].sort((a, b) => {
            const aPriority = priority[a.name] || 0;
            const bPriority = priority[b.name] || 0;
            return bPriority - aPriority;
        });
    }

    /**
     * Apply directive transformation to element
     * @private
     * @param {Object} element - Element to transform
     * @param {Object} directive - Directive to apply
     */
    applyDirectiveTransform(element, directive) {
        switch (directive.name) {
            case 'if':
                this.transformIfDirective(element, directive);
                break;
            case 'else-if':
                this.transformElseIfDirective(element, directive);
                break;
            case 'else':
                this.transformElseDirective(element, directive);
                break;
            case 'for':
                this.transformForDirective(element, directive);
                break;
            case 'show':
                this.transformShowDirective(element, directive);
                break;
            case 'model':
                this.transformModelDirective(element, directive);
                break;
            case 'bind':
                this.transformBindDirective(element, directive);
                break;
            case 'on':
                this.transformOnDirective(element, directive);
                break;
            case 'text':
                this.transformTextDirective(element, directive);
                break;
            case 'html':
                this.transformHtmlDirective(element, directive);
                break;
            case 'slot':
                this.transformSlotDirective(element, directive);
                break;
            default:
                this.addWarning(`Unknown directive: k-${directive.name}`);
        }
    }

    /**
     * Transform k-if directive
     * @private
     * @param {Object} element - Element
     * @param {Object} directive - Directive
     */
    transformIfDirective(element, directive) {
        element.condition = directive.value;
        element.conditionType = 'if';
        element.isDynamic = true;
        this.helpers.add('createCommentVNode');
    }

    /**
     * Transform k-for directive
     * @private
     * @param {Object} element - Element
     * @param {Object} directive - Directive
     */
    transformForDirective(element, directive) {
        // Parse k-for expression: "item in items" or "(item, index) in items"
        const forMatch = directive.value.match(/^\s*(?:\(?\s*(\w+)(?:\s*,\s*(\w+))?\s*\)?)\s+in\s+(.+)\s*$/);

        if (!forMatch) {
            this.addError(`Invalid k-for expression: ${directive.value}`);
            return;
        }

        const [, item, index, source] = forMatch;

        element.for = {
            source: source.trim(),
            item: item.trim(),
            index: index ? index.trim() : null
        };
        element.isDynamic = true;
        this.helpers.add('renderList');
    }

    /**
     * Transform k-show directive
     * @private
     * @param {Object} element - Element
     * @param {Object} directive - Directive
     */
    transformShowDirective(element, directive) {
        element.show = directive.value;
        element.isDynamic = true;
    }

    /**
     * Transform k-model directive
     * @private
     * @param {Object} element - Element
     * @param {Object} directive - Directive
     */
    transformModelDirective(element, directive) {
        element.model = {
            value: directive.value,
            modifiers: directive.modifiers
        };
        element.isDynamic = true;
        this.helpers.add('withModifiers');
    }

    /**
     * Transform k-bind directive
     * @private
     * @param {Object} element - Element
     * @param {Object} directive - Directive
     */
    transformBindDirective(element, directive) {
        if (!element.dynamicProps) {
            element.dynamicProps = {};
        }

        const prop = directive.arg || 'object';
        element.dynamicProps[prop] = directive.value;
        element.isDynamic = true;
    }

    /**
     * Transform k-on directive
     * @private
     * @param {Object} element - Element
     * @param {Object} directive - Directive
     */
    transformOnDirective(element, directive) {
        if (!element.events) {
            element.events = {};
        }

        const event = directive.arg;
        element.events[event] = {
            handler: directive.value,
            modifiers: directive.modifiers
        };
        element.isDynamic = true;

        if (directive.modifiers.length > 0) {
            this.helpers.add('withModifiers');
        }
    }

    /**
     * Transform k-text directive
     * @private
     * @param {Object} element - Element
     * @param {Object} directive - Directive
     */
    transformTextDirective(element, directive) {
        element.textContent = directive.value;
        element.children = []; // Clear children as text will replace them
        element.isDynamic = true;
        this.helpers.add('toDisplayString');
    }

    /**
     * Transform k-html directive
     * @private
     * @param {Object} element - Element
     * @param {Object} directive - Directive
     */
    transformHtmlDirective(element, directive) {
        element.innerHTML = directive.value;
        element.children = []; // Clear children as HTML will replace them
        element.isDynamic = true;
        this.addWarning('k-html can be dangerous. Only use with trusted content.');
    }

    /**
     * Transform k-slot directive
     * @private
     * @param {Object} element - Element
     * @param {Object} directive - Directive
     */
    transformSlotDirective(element, directive) {
        element.slot = {
            name: directive.arg || 'default',
            props: directive.value
        };
        this.helpers.add('renderSlot');
    }

    /**
     * Check if a node is static (can be hoisted)
     * @private
     * @param {Object} node - Node to check
     * @returns {boolean} Whether the node is static
     */
    isStaticNode(node) {
        if (node.isDynamic) return false;
        if (node.directives && node.directives.length > 0) return false;
        if (node.dynamicProps && Object.keys(node.dynamicProps).length > 0) return false;
        if (node.events && Object.keys(node.events).length > 0) return false;

        // Check children recursively
        if (node.children) {
            return node.children.every(child => this.isStaticNode(child));
        }

        return true;
    }

    /**
     * Generate render function code
     * @private
     * @param {Object} ast - Transformed AST
     * @param {Object} options - Generation options
     * @returns {string} Render function code
     */
    generateRenderFunction(ast, options) {
        let code = 'function render(_ctx, _cache) {\n';

        // Generate hoisted static nodes
        if (this.staticNodes.length > 0) {
            code += '  // Static hoisted nodes\n';
            this.staticNodes.forEach((node, index) => {
                code += `  const _hoisted_${index + 1} = ${this.generateNodeCode(node)};\n`;
            });
            code += '\n';
        }

        // Generate main render logic
        code += '  return ';

        if (ast.children.length === 0) {
            code += 'h("div", {}, ["Empty template"])';
        } else if (ast.children.length === 1) {
            code += this.generateNodeCode(ast.children[0]);
        } else {
            // Multiple root nodes - wrap in fragment
            this.helpers.add('Fragment');
            code += `h(Fragment, {}, [${ast.children.map(child => this.generateNodeCode(child)).join(', ')}])`;
        }

        code += ';\n}';

        return code;
    }

    /**
     * Generate code for a single node
     * @private
     * @param {Object} node - Node to generate code for
     * @returns {string} Generated code
     */
    generateNodeCode(node) {
        if (!node) return 'null';

        switch (node.type) {
            case 'element':
                return this.generateElementCode(node);
            case 'text':
                return JSON.stringify(node.content);
            case 'interpolation':
                return `_toDisplayString(${node.expression})`;
            default:
                return 'null';
        }
    }

    /**
     * Generate code for element node
     * @private
     * @param {Object} element - Element node
     * @returns {string} Generated code
     */
    generateElementCode(element) {
        // Handle static hoisted nodes
        if (element.isStatic && element.hoistId) {
            return `_hoisted_${element.hoistId}`;
        }

        // Handle conditional rendering
        if (element.condition) {
            const condition = element.condition;
            const elementCode = this.generateBasicElementCode(element);
            return `(${condition}) ? ${elementCode} : _createCommentVNode("k-if", true)`;
        }

        // Handle list rendering
        if (element.for) {
            const { source, item, index } = element.for;
            const itemCode = this.generateBasicElementCode(element);
            const indexParam = index ? `, ${index}` : '';
            return `_renderList(${source}, (${item}${indexParam}) => ${itemCode})`;
        }

        return this.generateBasicElementCode(element);
    }

    /**
     * Generate basic element code without special directives
     * @private
     * @param {Object} element - Element node
     * @returns {string} Generated code
     */
    generateBasicElementCode(element) {
        const tag = element.tagName;
        const props = this.generatePropsCode(element);
        const children = this.generateChildrenCode(element);

        return `h("${tag}", ${props}, ${children})`;
    }

    /**
     * Generate props code for element
     * @private
     * @param {Object} element - Element node
     * @returns {string} Props code
     */
    generatePropsCode(element) {
        const props = [];

        // Static attributes
        for (const [name, value] of Object.entries(element.attributes || {})) {
            if (!name.startsWith('k-') && !name.startsWith(':') && !name.startsWith('@')) {
                props.push(`${JSON.stringify(name)}: ${JSON.stringify(value)}`);
            }
        }

        // Dynamic props from k-bind
        if (element.dynamicProps) {
            for (const [prop, value] of Object.entries(element.dynamicProps)) {
                props.push(`${JSON.stringify(prop)}: ${value}`);
            }
        }

        // Event handlers from k-on
        if (element.events) {
            for (const [event, config] of Object.entries(element.events)) {
                const handler = config.modifiers.length > 0
                    ? `_withModifiers(${config.handler}, ${JSON.stringify(config.modifiers)})`
                    : config.handler;
                props.push(`${JSON.stringify('on' + event.charAt(0).toUpperCase() + event.slice(1))}: ${handler}`);
            }
        }

        // k-show directive
        if (element.show) {
            props.push(`style: { display: (${element.show}) ? '' : 'none' }`);
        }

        // k-model directive
        if (element.model) {
            const { value, modifiers } = element.model;
            props.push(`value: ${value}`);

            const eventName = element.tagName === 'input' &&
                (element.attributes?.type === 'checkbox' || element.attributes?.type === 'radio')
                ? 'onChange' : 'onInput';

            const handler = `($event) => { ${value} = $event.target.${element.attributes?.type === 'checkbox' ? 'checked' : 'value'}; }`;
            props.push(`${JSON.stringify(eventName)}: ${handler}`);
        }

        return props.length > 0 ? `{ ${props.join(', ')} }` : 'null';
    }

    /**
     * Generate children code for element
     * @private
     * @param {Object} element - Element node
     * @returns {string} Children code
     */
    generateChildrenCode(element) {
        // Handle k-text directive
        if (element.textContent) {
            return `_toDisplayString(${element.textContent})`;
        }

        // Handle k-html directive
        if (element.innerHTML) {
            // Note: This is a simplified implementation
            // In a real implementation, you'd need proper innerHTML handling
            return `{ innerHTML: ${element.innerHTML} }`;
        }

        // Handle slot
        if (element.slot) {
            const { name, props } = element.slot;
            return `_renderSlot(_ctx.$slots, ${JSON.stringify(name)}, ${props || 'null'})`;
        }

        // Regular children
        if (!element.children || element.children.length === 0) {
            return 'null';
        }

        const childrenCode = element.children.map(child => this.generateNodeCode(child));
        return `[${childrenCode.join(', ')}]`;
    }

    /**
     * Generate import statements for helpers
     * @private
     * @returns {Array} Array of import statements
     */
    generateImports() {
        const imports = ['h'];

        // Add required helpers
        if (this.helpers.has('toDisplayString')) imports.push('toDisplayString as _toDisplayString');
        if (this.helpers.has('createCommentVNode')) imports.push('createCommentVNode as _createCommentVNode');
        if (this.helpers.has('renderList')) imports.push('renderList as _renderList');
        if (this.helpers.has('withModifiers')) imports.push('withModifiers as _withModifiers');
        if (this.helpers.has('renderSlot')) imports.push('renderSlot as _renderSlot');
        if (this.helpers.has('Fragment')) imports.push('Fragment');

        return [`import { ${imports.join(', ')} } from "@kalxjs/core";`];
    }

    /**
     * Generate error render function
     * @private
     * @param {Error} error - Error that occurred
     * @returns {string} Error render function code
     */
    generateErrorRenderFunction(error) {
        return `function render() {
  return h('div', {
    style: 'padding: 20px; border: 2px solid red; border-radius: 4px; background-color: #fff5f5; color: #c53030;'
  }, [
    h('h2', {}, ['Template Compilation Error']),
    h('p', {}, [${JSON.stringify(error.message)}])
  ]);
}`;
    }

    /**
     * Generate source map
     * @private
     * @returns {Object} Source map object
     */
    generateSourceMap() {
        // Simplified source map generation
        return {
            version: 3,
            sources: ['template.kal'],
            mappings: '',
            names: []
        };
    }

    /**
     * Parse attributes from attribute string
     * @private
     * @param {string} attrString - Attribute string
     * @returns {Object} Parsed attributes
     */
    parseAttributes(attrString) {
        const attrs = {};

        if (!attrString.trim()) {
            return attrs;
        }

        const attrPattern = /([a-zA-Z:@][a-zA-Z0-9-:@.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let match;

        while ((match = attrPattern.exec(attrString)) !== null) {
            const [, name, doubleQuoted, singleQuoted, unquoted] = match;
            const value = doubleQuoted !== undefined ? doubleQuoted :
                singleQuoted !== undefined ? singleQuoted :
                    unquoted !== undefined ? unquoted : true;

            attrs[name] = value;
        }

        return attrs;
    }

    /**
     * Check if tag is self-closing
     * @private
     * @param {string} tagName - Tag name
     * @returns {boolean} Whether tag is self-closing
     */
    isSelfClosingTag(tagName) {
        const selfClosingTags = new Set([
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
            'link', 'meta', 'param', 'source', 'track', 'wbr'
        ]);
        return selfClosingTags.has(tagName.toLowerCase());
    }

    /**
     * Add error to error list
     * @private
     * @param {string} message - Error message
     */
    addError(message) {
        this.errors.push({ type: 'error', message });
    }

    /**
     * Add warning to warning list
     * @private
     * @param {string} message - Warning message
     */
    addWarning(message) {
        this.warnings.push({ type: 'warning', message });
    }
}

/**
 * Compile a template string
 * @param {string} template - Template string
 * @param {Object} options - Compilation options
 * @returns {Object} Compilation result
 */
export function compileAdvancedTemplate(template, options = {}) {
    const compiler = new AdvancedTemplateCompiler(options);
    return compiler.compile(template, options);
}

// Export with standard name for compatibility
export function compileTemplate(template, options = {}) {
    return compileAdvancedTemplate(template, options);
}

/**
 * Create a template compiler instance
 * @param {Object} options - Compiler options
 * @returns {AdvancedTemplateCompiler} Compiler instance
 */
export function createTemplateCompiler(options = {}) {
    return new AdvancedTemplateCompiler(options);
}