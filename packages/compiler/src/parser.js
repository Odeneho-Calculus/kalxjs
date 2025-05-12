// @kalxjs/compiler - Parser for .klx files

/**
 * Parses a KLX single-file component into an AST
 * @param {string} source - Source code of the .klx file
 * @returns {Object} AST representation of the component
 */
export function parse(source) {
    const result = {
        template: null,
        script: null,
        style: null,
        errors: []
    };

    try {
        // Find template section
        const templateMatch = /<template>([\s\S]*?)<\/template>/i.exec(source);
        if (templateMatch) {
            result.template = {
                content: templateMatch[1].trim(),
                start: templateMatch.index,
                end: templateMatch.index + templateMatch[0].length
            };
        } else {
            result.errors.push('No <template> section found');
        }

        // Find script section
        const scriptMatch = /<script>([\s\S]*?)<\/script>/i.exec(source);
        if (scriptMatch) {
            result.script = {
                content: scriptMatch[1].trim(),
                start: scriptMatch.index,
                end: scriptMatch.index + scriptMatch[0].length
            };
        } else {
            result.errors.push('No <script> section found');
        }

        // Find style section
        const styleMatch = /<style(\s+scoped)?>([\s\S]*?)<\/style>/i.exec(source);
        if (styleMatch) {
            result.style = {
                content: styleMatch[2].trim(),
                scoped: !!styleMatch[1],
                start: styleMatch.index,
                end: styleMatch.index + styleMatch[0].length
            };
        }
    } catch (error) {
        result.errors.push(`Parsing error: ${error.message}`);
    }

    return result;
}

/**
 * Parses the template section into a template AST
 * @param {string} template - Template HTML content
 * @returns {Object} Template AST
 */
export function parseTemplate(template) {
    // This is a simplified version - a real implementation would use a proper HTML parser
    const ast = {
        type: 'Template',
        children: []
    };

    // Simple regex-based parsing for demonstration
    // In a real implementation, use a proper HTML parser
    const tagRegex = /<([a-z0-9-]+)(?:\s+([^>]*))?(?:\/>|>([\s\S]*?)<\/\1>)/gi;
    let match;

    while ((match = tagRegex.exec(template))) {
        const [, tag, attrs, content] = match;

        const node = {
            type: 'Element',
            tag,
            attrs: parseAttributes(attrs || ''),
            children: content ? parseTemplate(content).children : []
        };

        ast.children.push(node);
    }

    // Handle text nodes
    const textRegex = /{{([^}]+)}}/g;
    const textNodes = template.split(tagRegex).filter(Boolean);

    for (const text of textNodes) {
        if (text.trim()) {
            let lastIndex = 0;
            let textMatch;

            while ((textMatch = textRegex.exec(text))) {
                const [fullMatch, expression] = textMatch;
                const index = textMatch.index;

                // Add text before the expression
                if (index > lastIndex) {
                    ast.children.push({
                        type: 'Text',
                        content: text.slice(lastIndex, index)
                    });
                }

                // Add the expression
                ast.children.push({
                    type: 'Expression',
                    content: expression.trim()
                });

                lastIndex = index + fullMatch.length;
            }

            // Add remaining text
            if (lastIndex < text.length) {
                ast.children.push({
                    type: 'Text',
                    content: text.slice(lastIndex)
                });
            }
        }
    }

    return ast;
}

/**
 * Parses HTML attributes into an object
 * @private
 * @param {string} attrs - HTML attributes string
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attrs) {
    const result = {};
    const attrRegex = /([a-z0-9-:@]+)(?:=["']([^"']*)["'])?/gi;
    let match;

    while ((match = attrRegex.exec(attrs))) {
        const [, name, value] = match;
        result[name] = value || true;
    }

    return result;
}