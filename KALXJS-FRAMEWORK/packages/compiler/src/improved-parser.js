// @kalxjs/compiler - Improved parser for .klx files

/**
 * Parses a KLX file into an AST
 * @param {string} source - Source code of the .klx file
 * @returns {Object} AST with template, script, and style sections
 */
export function parse(source) {
    console.log('[improved-parser] Parsing KLX file');

    // Parse the template, script, and style sections
    const templateMatch = /<template>([\s\S]*?)<\/template>/.exec(source);
    const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(source);
    const styleMatch = /<style(?:\s+scoped)?>([\s\S]*?)<\/style>/.exec(source);

    // Check if template section exists
    const template = templateMatch ? {
        content: templateMatch[1],
        start: templateMatch.index,
        end: templateMatch.index + templateMatch[0].length,
        isDefault: false
    } : null;

    if (template) {
        console.log(`Template section found with length: ${template.content.length}`);
    } else {
        console.warn('No template section found');
    }

    // Check if script section exists
    const script = scriptMatch ? {
        content: scriptMatch[1],
        start: scriptMatch.index,
        end: scriptMatch.index + scriptMatch[0].length
    } : null;

    if (script) {
        console.log(`Script section found with length: ${script.content.length}`);
    } else {
        console.warn('No script section found');
    }

    // Check if style section exists
    const style = styleMatch ? {
        content: styleMatch[1],
        start: styleMatch.index,
        end: styleMatch.index + styleMatch[0].length,
        scoped: styleMatch[0].includes('scoped')
    } : null;

    if (style) {
        console.log(`Style section found with length: ${style.content.length}`);
    }

    return {
        template,
        script,
        style,
        errors: []
    };
}

/**
 * Parses a template string into an AST
 * @param {string} template - Template HTML content
 * @returns {Object} Template AST
 */
export function parseTemplate(template) {
    console.log('[improved-parser] Parsing template');

    try {
        // Create the root AST node
        const ast = {
            type: 'Template',
            children: []
        };

        // Parse the template content
        const rootElement = parseElement(template.trim());
        if (rootElement) {
            ast.children.push(rootElement);
        } else {
            console.warn('[improved-parser] No root element found in template');
            // Create a fallback div
            ast.children.push({
                type: 'Element',
                tag: 'div',
                attrs: {},
                children: [{ type: 'Text', content: 'Failed to parse template' }]
            });
        }

        return ast;
    } catch (error) {
        console.error('[improved-parser] Error parsing template:', error);
        // Return a minimal AST with an error message
        return {
            type: 'Template',
            children: [{
                type: 'Element',
                tag: 'div',
                attrs: { style: 'color: red; border: 1px solid red; padding: 10px;' },
                children: [{ type: 'Text', content: `Template parsing error: ${error.message}` }]
            }]
        };
    }
}

/**
 * Parses an HTML element string into an element node
 * @private
 * @param {string} html - HTML string
 * @returns {Object|null} Element node or null if parsing fails
 */
function parseElement(html) {
    // Simplified regex to match the opening tag
    const openTagRegex = /^<([a-zA-Z0-9_-]+)([^>]*)>/;
    const openMatch = openTagRegex.exec(html);

    if (!openMatch) {
        return null;
    }

    const tag = openMatch[1];
    const attrsString = openMatch[2];

    // Create the element node
    const element = {
        type: 'Element',
        tag,
        attrs: parseAttributes(attrsString),
        children: []
    };

    // Find the closing tag
    const closeTagRegex = new RegExp(`</${tag}>$`);
    const hasClosingTag = closeTagRegex.test(html);

    if (!hasClosingTag) {
        console.warn(`[improved-parser] No closing tag found for <${tag}>`);
        return element;
    }

    // Extract the content between the tags
    const contentStart = openMatch[0].length;
    const contentEnd = html.length - `</${tag}>`.length;
    const content = html.substring(contentStart, contentEnd);

    // Parse the content
    parseContent(content, element.children);

    return element;
}

/**
 * Parses HTML content into child nodes
 * @private
 * @param {string} content - HTML content
 * @param {Array} children - Array to store child nodes
 */
function parseContent(content, children) {
    // Check for template expressions {{ ... }}
    const expressionRegex = /{{([^}]+)}}/g;
    let match;
    let lastIndex = 0;

    while ((match = expressionRegex.exec(content))) {
        // Add text before the expression
        if (match.index > lastIndex) {
            const textBefore = content.substring(lastIndex, match.index);
            if (textBefore.trim()) {
                children.push({
                    type: 'Text',
                    content: textBefore
                });
            }
        }

        // Add the expression
        const expression = match[1].trim();
        children.push({
            type: 'Expression',
            content: expression
        });

        lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < content.length) {
        const remainingText = content.substring(lastIndex);
        if (remainingText.trim()) {
            children.push({
                type: 'Text',
                content: remainingText
            });
        }
    }
}

/**
 * Parses HTML attributes string into an attributes object
 * @private
 * @param {string} attrsString - HTML attributes string
 * @returns {Object} Attributes object
 */
function parseAttributes(attrsString) {
    const attrs = {};

    // Match attributes with or without values
    const attrRegex = /([a-zA-Z0-9_:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]*))?)?/g;
    let match;

    while ((match = attrRegex.exec(attrsString))) {
        const name = match[1];
        // Value can be in quotes or without quotes
        const value = match[2] || match[3] || match[4] || true;
        attrs[name] = value;
    }

    return attrs;
}