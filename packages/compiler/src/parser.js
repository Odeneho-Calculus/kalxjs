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
        // Find template section - improved to handle attributes and whitespace
        const templateMatch = /<template(?:\s+[^>]*)?>([\s\S]*?)<\/template>/i.exec(source);
        if (templateMatch) {
            result.template = {
                content: templateMatch[1].trim(),
                start: templateMatch.index,
                end: templateMatch.index + templateMatch[0].length
            };
            console.log('Template section found with length:', templateMatch[1].trim().length);
        } else {
            // Create a default template instead of just reporting an error
            console.warn('No <template> section found, creating default template');
            result.template = {
                content: '<div class="default-template">Default Template Content</div>',
                start: 0,
                end: 0,
                isDefault: true
            };
            // Still add the error for reference
            result.errors.push('No <template> section found, using default template');
        }

        // Find main script section - improved to handle multiple script sections
        const scriptMatches = Array.from(source.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi));

        if (scriptMatches && scriptMatches.length > 0) {
            console.log('Found', scriptMatches.length, 'script sections');

            // Use the first script section without setup attribute as the main script
            const mainScriptMatch = scriptMatches.find(match => !match[0].includes('setup'));

            if (mainScriptMatch) {
                result.script = {
                    content: mainScriptMatch[1].trim(),
                    start: mainScriptMatch.index,
                    end: mainScriptMatch.index + mainScriptMatch[0].length
                };
                console.log('Main script section found with length:', mainScriptMatch[1].trim().length);
            } else {
                // If no main script found, use the first script section
                result.script = {
                    content: scriptMatches[0][1].trim(),
                    start: scriptMatches[0].index,
                    end: scriptMatches[0].index + scriptMatches[0][0].length
                };
                console.log('Using first script section with length:', scriptMatches[0][1].trim().length);
            }

            // Handle script setup if present
            const setupScriptMatch = scriptMatches.find(match => match[0].includes('setup'));
            if (setupScriptMatch) {
                result.scriptSetup = {
                    content: setupScriptMatch[1].trim(),
                    start: setupScriptMatch.index,
                    end: setupScriptMatch.index + setupScriptMatch[0].length
                };
                console.log('Script setup section found with length:', setupScriptMatch[1].trim().length);
            }
        } else {
            result.errors.push('No <script> section found');
            console.error('No script section found in source');
        }

        // Find style section - improved to handle lang attribute
        const styleMatch = /<style(?:\s+(?:scoped|lang="[^"]*"))*>([\s\S]*?)<\/style>/i.exec(source);
        if (styleMatch) {
            const styleTag = styleMatch[0].substring(0, styleMatch[0].indexOf('>'));
            result.style = {
                content: styleMatch[1].trim(),
                scoped: styleTag.includes('scoped'),
                lang: (styleTag.match(/lang="([^"]*)"/) || [])[1] || 'css',
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
    try {
        // This is a simplified version - a real implementation would use a proper HTML parser
        const ast = {
            type: 'Template',
            children: []
        };

        // Improved regex-based parsing
        // First, let's handle the root element
        const rootElementRegex = /<([a-z0-9-]+)(?:\s+([^>]*))?>([\s\S]*?)<\/\1>/i;
        const rootMatch = rootElementRegex.exec(template);

        if (!rootMatch) {
            // If no root element is found, create a fallback div
            console.warn('No root element found in template, creating fallback div');
            ast.children.push({
                type: 'Element',
                tag: 'div',
                attrs: {},
                children: [{ type: 'Text', content: template }]
            });
            return ast;
        }

        const [, rootTag, rootAttrs, rootContent] = rootMatch;

        // Create the root element node
        const rootNode = {
            type: 'Element',
            tag: rootTag,
            attrs: parseAttributes(rootAttrs || ''),
            children: []
        };

        // Parse the content of the root element
        parseContent(rootContent, rootNode.children);

        // Add the root node to the AST
        ast.children.push(rootNode);

        return ast;
    } catch (error) {
        console.error('Error parsing template:', error);
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
 * Parses the content of an element
 * @private
 * @param {string} content - Element content
 * @param {Array} children - Array to store child nodes
 */
function parseContent(content, children) {
    // First, remove HTML comments for processing
    const contentWithoutComments = content.replace(/<!--[\s\S]*?-->/g, '');

    // Handle elements
    const elementRegex = /<([a-z0-9-]+)(?:\s+([^>]*))?(?:\/>|>([\s\S]*?)<\/\1>)/gi;
    let lastIndex = 0;
    let match;

    // Keep track of processed positions to avoid infinite loops
    const processedPositions = new Set();

    while ((match = elementRegex.exec(contentWithoutComments))) {
        const [fullMatch, tag, attrs, elementContent] = match;
        const matchIndex = match.index;

        // Check if we've already processed this position
        if (processedPositions.has(matchIndex)) {
            continue;
        }
        processedPositions.add(matchIndex);

        // Add text before the element
        if (matchIndex > lastIndex) {
            const textBefore = contentWithoutComments.substring(lastIndex, matchIndex);
            if (textBefore.trim()) {
                parseTextContent(textBefore, children);
            }
        }

        // Create the element node
        const elementNode = {
            type: 'Element',
            tag,
            attrs: parseAttributes(attrs || ''),
            children: []
        };

        // Parse the content of the element if it's not self-closing
        if (elementContent !== undefined) {
            parseContent(elementContent, elementNode.children);
        }


        // Add the element node to the children
        children.push(elementNode);

        lastIndex = matchIndex + fullMatch.length;
    }


    // Add any remaining text
    if (lastIndex < contentWithoutComments.length) {
        const remainingText = contentWithoutComments.substring(lastIndex);
        if (remainingText.trim()) {
            parseTextContent(remainingText, children);
        }
    }
}

/**
 * Parses text content, handling expressions
 * @private
 * @param {string} text - Text content
 * @param {Array} children - Array to store child nodes
 */
function parseTextContent(text, children) {
    if (!text.trim()) return;

    const expressionRegex = /{{([^}]+)}}/g;
    let lastIndex = 0;
    let match;

    while ((match = expressionRegex.exec(text))) {
        const [fullMatch, expression] = match;
        const matchIndex = match.index;

        // Add text before the expression
        if (matchIndex > lastIndex) {
            children.push({
                type: 'Text',
                content: text.substring(lastIndex, matchIndex)
            });
        }

        // Add the expression
        children.push({
            type: 'Expression',
            content: expression.trim()
        });

        lastIndex = matchIndex + fullMatch.length;
    }

    // Add any remaining text
    if (lastIndex < text.length) {
        children.push({
            type: 'Text',
            content: text.substring(lastIndex)
        });
    }
}

/**
 * Parses HTML attributes into an object
 * @private
 * @param {string} attrs - HTML attributes string
 * @returns {Object} Parsed attributes
 */
function parseAttributes(attrs) {
    const result = {};

    if (!attrs) return result;

    // Improved attribute regex that handles quotes better
    const attrRegex = /([a-z0-9-:@\.]+)(?:=(?:["']([^"']*)["']|([^\s>]*))?)?/gi;
    let match;

    while ((match = attrRegex.exec(attrs))) {
        const [, name, quotedValue, unquotedValue] = match;
        const value = quotedValue !== undefined ? quotedValue : (unquotedValue || true);

        // Handle special attributes
        if (name.startsWith('@')) {
            // Event binding (@click -> onClick)
            const eventName = name.slice(1);
            result[`on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`] = value;
        } else if (name.startsWith(':')) {
            // Prop binding (:prop -> prop)
            result[name.slice(1)] = value;
        } else if (name.startsWith('v-')) {
            // Directives (v-if, v-for, etc.)
            result[name] = value;
        } else {
            // Regular attributes
            result[name] = value;
        }
    }

    return result;
}