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
        // Use a more robust regex that handles newlines and whitespace better
        const scriptRegex = /<script(?:\s+([^>]*))?>([\s\S]*?)<\/script>/gi;
        let scriptContent = '';
        let scriptMatch;

        console.log('[parser] Parsing script sections');

        console.log('[parser] Parsing script sections');

        // Reset the regex index
        scriptRegex.lastIndex = 0;

        // Test if there's at least one script tag
        if (scriptRegex.test(source)) {
            // Reset the regex index again
            scriptRegex.lastIndex = 0;

            // Get all script matches
            const scriptMatches = [];
            while ((scriptMatch = scriptRegex.exec(source)) !== null) {
                const attrs = scriptMatch[1] || '';
                const content = scriptMatch[2].trim();

                // Log detailed information about the script match for debugging
                console.log('Script match details:');
                console.log('- Full match length:', scriptMatch[0].length);
                console.log('- Attributes:', attrs);
                console.log('- Content length:', content.length);
                console.log('- Content starts with:', content.substring(0, 50));
                console.log('- Is setup script:', attrs && attrs.includes('setup'));

                // Skip empty script tags
                if (content.length === 0) {
                    console.warn('Empty script tag found, skipping');
                    continue;
                }

                scriptMatches.push({
                    fullMatch: scriptMatch[0],
                    attrs: attrs,
                    content: content,
                    index: scriptMatch.index,
                    isSetup: attrs && attrs.includes('setup')
                });
            }

            console.log('Found', scriptMatches.length, 'script sections');

            if (scriptMatches.length > 0) {
                // Use the first script section without setup attribute as the main script
                const mainScriptMatch = scriptMatches.find(match => !match.isSetup);

                if (mainScriptMatch) {
                    result.script = {
                        content: mainScriptMatch.content,
                        start: mainScriptMatch.index,
                        end: mainScriptMatch.index + mainScriptMatch.fullMatch.length
                    };
                    console.log('Main script section found with length:', mainScriptMatch.content.length);
                } else {
                    // If no main script found, use the first script section
                    result.script = {
                        content: scriptMatches[0].content,
                        start: scriptMatches[0].index,
                        end: scriptMatches[0].index + scriptMatches[0].fullMatch.length
                    };
                    console.log('Using first script section with length:', scriptMatches[0].content.length);
                }

                // Handle script setup if present
                const setupScriptMatch = scriptMatches.find(match => match.isSetup);
                if (setupScriptMatch) {
                    result.scriptSetup = {
                        content: setupScriptMatch.content,
                        start: setupScriptMatch.index,
                        end: setupScriptMatch.index + setupScriptMatch.fullMatch.length
                    };
                    console.log('Script setup section found with length:', setupScriptMatch.content.length);
                }
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

        // Clean up the template - remove leading/trailing whitespace and newlines
        const cleanTemplate = template.trim();

        // Log the template for debugging
        console.log('[parser] Template length:', cleanTemplate.length);
        console.log('[parser] Template starts with:', cleanTemplate.substring(0, 50));

        // Improved regex-based parsing
        // First, let's handle the root element with a more robust regex
        const rootElementRegex = /<([a-z0-9-]+)(?:\s+([^>]*))?>([\s\S]*?)<\/\1>/i;
        const rootMatch = rootElementRegex.exec(cleanTemplate);

        if (!rootMatch) {
            // If no root element is found, create a fallback div
            console.warn('[parser] No root element found in template, creating fallback div');
            ast.children.push({
                type: 'Element',
                tag: 'div',
                attrs: {},
                children: [{ type: 'Text', content: cleanTemplate }]
            });
            return ast;
        }

        // Log the root element for debugging
        console.log('[parser] Root element found:', rootMatch[1]);

        const [, rootTag, rootAttrs, rootContent] = rootMatch;

        // Create the root element node
        const rootNode = {
            type: 'Element',
            tag: rootTag,
            attrs: parseAttributes(rootAttrs || ''),
            children: []
        };

        try {
            // Parse the content of the root element
            parseContent(rootContent, rootNode.children);
        } catch (contentError) {
            console.error('[parser] Error parsing content:', contentError);
            // Add a text node with the error message
            rootNode.children.push({
                type: 'Text',
                content: `Error parsing content: ${contentError.message}`
            });
        }

        // Add the root node to the AST
        ast.children.push(rootNode);

        // Validate the AST structure
        if (!ast.children.length || !ast.children[0].children) {
            console.warn('[parser] AST validation failed, adding fallback content');
            if (!ast.children.length) {
                ast.children.push({
                    type: 'Element',
                    tag: 'div',
                    attrs: {},
                    children: [{ type: 'Text', content: 'Fallback content: Empty AST' }]
                });
            } else if (!ast.children[0].children) {
                ast.children[0].children = [{
                    type: 'Text',
                    content: 'Fallback content: Missing children'
                }];
            }
        }

        return ast;
    } catch (error) {
        console.error('[parser] Error parsing template:', error);
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
    try {
        // First, remove HTML comments for processing
        const contentWithoutComments = content.replace(/<!--[\s\S]*?-->/g, '');

        // If the content is just whitespace, return early
        if (!contentWithoutComments.trim()) {
            return;
        }

        // Log for debugging
        console.log('[parser] Parsing content length:', contentWithoutComments.length);

        // Handle self-closing tags first
        const selfClosingRegex = /<([a-z0-9-]+)(?:\s+([^>]*))?\s*\/>/gi;
        let selfClosingMatch;

        // Process all self-closing tags
        while ((selfClosingMatch = selfClosingRegex.exec(contentWithoutComments))) {
            const [fullMatch, tag, attrs] = selfClosingMatch;

            // Log for debugging
            console.log('[parser] Found self-closing tag:', tag);

            // Create the element node for self-closing tag
            const elementNode = {
                type: 'Element',
                tag,
                attrs: parseAttributes(attrs || ''),
                children: [],
                selfClosing: true
            };

            // Add the element node to the children
            children.push(elementNode);
        }

        // Now handle regular elements with opening and closing tags
        // Use a more robust regex that handles nesting better
        const elementRegex = /<([a-z0-9-]+)(?:\s+([^>]*))?>([\s\S]*?)<\/\1>/gi;
        let lastIndex = 0;
        let match;

        // Reset the regex
        elementRegex.lastIndex = 0;

        // Keep track of processed positions to avoid infinite loops
        const processedPositions = new Set();
        let iterationCount = 0;
        const maxIterations = 1000; // Safety limit

        // Process all regular elements
        while ((match = elementRegex.exec(contentWithoutComments)) && iterationCount < maxIterations) {
            iterationCount++;
            const [fullMatch, tag, attrs, elementContent] = match;
            const matchIndex = match.index;

            // Check if we've already processed this position
            if (processedPositions.has(matchIndex)) {
                console.warn('[parser] Already processed position:', matchIndex);
                continue;
            }
            processedPositions.add(matchIndex);

            // Log for debugging
            console.log('[parser] Found element tag:', tag);

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

            // Parse the content of the element
            if (elementContent) {
                try {
                    parseContent(elementContent, elementNode.children);
                } catch (error) {
                    console.error('[parser] Error parsing nested content:', error);
                    // Add a text node with the error message
                    elementNode.children.push({
                        type: 'Text',
                        content: `Error parsing nested content: ${error.message}`
                    });
                }
            }

            // Add the element node to the children
            children.push(elementNode);

            lastIndex = matchIndex + fullMatch.length;
        }

        if (iterationCount >= maxIterations) {
            console.warn('[parser] Reached maximum iterations when parsing content');
        }

        // Add any remaining text
        if (lastIndex < contentWithoutComments.length) {
            const remainingText = contentWithoutComments.substring(lastIndex);
            if (remainingText.trim()) {
                parseTextContent(remainingText, children);
            }
        }
    } catch (error) {
        console.error('[parser] Error in parseContent:', error);
        // Add a fallback text node
        children.push({
            type: 'Text',
            content: `Error parsing content: ${error.message}`
        });
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