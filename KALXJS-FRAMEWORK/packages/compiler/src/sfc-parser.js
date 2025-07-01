// @kalxjs/compiler - SFC Parser for .kal files
// This parser handles Single File Components with <template>, <script>, and <style> sections

/**
 * Parses a KAL Single File Component into an AST
 * @param {string} source - Source code of the .kal file
 * @returns {Object} AST with template, script, and style sections
 */
export function parseSFC(source) {
    console.log('[sfc-parser] Parsing KAL file');

    // Parse the template, script, and style sections with improved regex
    // These patterns handle attributes and whitespace better
    const templateMatch = /<template(?:\s+([^>]*))?>([\s\S]*?)<\/template>/i.exec(source);
    const scriptMatch = /<script(?:\s+([^>]*))?>([\s\S]*?)<\/script>/i.exec(source);
    const styleMatch = /<style(?:\s+([^>]*))?>([\s\S]*?)<\/style>/i.exec(source);

    // Check if template section exists
    const template = templateMatch ? {
        content: templateMatch[2],
        attrs: parseAttributes(templateMatch[1] || ''),
        start: templateMatch.index,
        end: templateMatch.index + templateMatch[0].length
    } : null;

    if (template) {
        console.log(`[sfc-parser] Template section found with length: ${template.content.length}`);
    } else {
        console.warn('[sfc-parser] No template section found');
    }

    // Check if script section exists
    const script = scriptMatch ? {
        content: scriptMatch[2],
        attrs: parseAttributes(scriptMatch[1] || ''),
        start: scriptMatch.index,
        end: scriptMatch.index + scriptMatch[0].length
    } : null;

    if (script) {
        console.log(`[sfc-parser] Script section found with length: ${script.content.length}`);

        // Check for script type
        if (script.attrs.setup) {
            console.log('[sfc-parser] Script has setup attribute');
        }
        if (script.attrs.lang) {
            console.log(`[sfc-parser] Script language: ${script.attrs.lang}`);
        }
    } else {
        console.warn('[sfc-parser] No script section found');
    }

    // Check if style section exists
    const style = styleMatch ? {
        content: styleMatch[2],
        attrs: parseAttributes(styleMatch[1] || ''),
        start: styleMatch.index,
        end: styleMatch.index + styleMatch[0].length
    } : null;

    if (style) {
        console.log(`[sfc-parser] Style section found with length: ${style.content.length}`);

        // Check for style attributes
        if (style.attrs.scoped) {
            console.log('[sfc-parser] Style has scoped attribute');
        }
        if (style.attrs.lang) {
            console.log(`[sfc-parser] Style language: ${style.attrs.lang}`);
        }
    }

    // Check for custom blocks
    const customBlocks = [];
    const customBlockRegex = /<([a-z0-9-]+)(?:\s+([^>]*))?>([\s\S]*?)<\/\1>/gi;
    let customMatch;

    // Reset the regex lastIndex
    customBlockRegex.lastIndex = 0;

    while ((customMatch = customBlockRegex.exec(source)) !== null) {
        const tagName = customMatch[1].toLowerCase();

        // Skip the standard blocks we've already processed
        if (tagName === 'template' || tagName === 'script' || tagName === 'style') {
            continue;
        }

        customBlocks.push({
            type: tagName,
            content: customMatch[3],
            attrs: parseAttributes(customMatch[2] || ''),
            start: customMatch.index,
            end: customMatch.index + customMatch[0].length
        });

        console.log(`[sfc-parser] Custom block found: ${tagName}`);
    }

    return {
        template,
        script,
        style,
        customBlocks,
        errors: []
    };
}

/**
 * Parse HTML attributes string into an object
 * @param {string} attrsString - String containing HTML attributes
 * @returns {Object} Attributes as key-value pairs
 */
function parseAttributes(attrsString) {
    const attrs = {};

    if (!attrsString) {
        return attrs;
    }

    // Match attributes with or without values
    // This regex handles:
    // - boolean attributes (name)
    // - quoted values (name="value" or name='value')
    // - unquoted values (name=value)
    const attrRegex = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/g;

    let match;
    while ((match = attrRegex.exec(attrsString)) !== null) {
        const name = match[1];
        // Value can be in group 2, 3, or 4 depending on quotes
        const value = match[2] !== undefined ? match[2] :
            match[3] !== undefined ? match[3] :
                match[4] !== undefined ? match[4] : true;

        attrs[name] = value;
    }

    return attrs;
}

/**
 * Parses a template string into an AST
 * @param {string} template - Template HTML content
 * @returns {Object} Template AST
 */
export function parseTemplate(template) {
    console.log('[sfc-parser] Parsing template');

    try {
        // Create the root AST node
        const ast = {
            type: 'Template',
            children: []
        };

        // Parse the template content
        let tokens = [];
        try {
            tokens = tokenizeHTML(template.trim());
            console.log('[sfc-parser] Tokenization complete, tokens:', tokens.length);
        } catch (error) {
            console.error('[sfc-parser] Error during tokenization:', error);
            // Create a minimal token set for a fallback element
            tokens = [
                { type: 'OpenTag', name: 'div', attrs: { style: 'color: red; border: 1px solid red; padding: 10px;' }, selfClosing: false },
                { type: 'Text', content: `Tokenization error: ${error.message}` },
                { type: 'CloseTag', name: 'div' }
            ];
        }

        const rootElement = buildAST(tokens);

        if (rootElement) {
            ast.children.push(rootElement);
        } else {
            console.warn('[sfc-parser] No root element found in template');
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
        console.error('[sfc-parser] Error parsing template:', error);
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
 * Tokenizes HTML into a stream of tokens
 * @private
 * @param {string} html - HTML string
 * @returns {Array} Array of tokens
 */
function tokenizeHTML(html) {
    console.log('[sfc-parser] Starting tokenization of HTML');
    console.log('[sfc-parser] HTML length:', html.length);
    console.log('[sfc-parser] HTML preview:', html.substring(0, 50) + '...');

    const tokens = [];
    let currentPosition = 0;
    let lastPosition = -1;
    let iterationCount = 0;
    const maxIterations = 10000; // Safety limit

    // Helper function to check if we're at the end of the input
    const isEOF = () => currentPosition >= html.length;

    // Helper function to peek ahead without consuming
    const peek = (n = 1) => currentPosition + n < html.length ? html[currentPosition + n] : null;

    // Helper function to consume the next character
    const consume = () => html[currentPosition++];

    // Helper function to consume characters while a condition is true
    const consumeWhile = (condition) => {
        let result = '';
        while (!isEOF() && condition(peek(0))) {
            result += consume();
        }
        return result;
    };

    // Process the HTML string
    while (!isEOF()) {
        // Safety check to prevent infinite loops
        iterationCount++;
        if (iterationCount > maxIterations) {
            console.error('[sfc-parser] Tokenization exceeded maximum iterations, possible infinite loop');
            console.error('[sfc-parser] Current position:', currentPosition, 'of', html.length);
            console.error('[sfc-parser] Current character:', html[currentPosition]);
            console.error('[sfc-parser] Context:', html.substring(Math.max(0, currentPosition - 20), currentPosition + 20));
            break;
        }

        // Check if we're stuck at the same position
        if (currentPosition === lastPosition) {
            console.error('[sfc-parser] Tokenization stuck at position:', currentPosition);
            console.error('[sfc-parser] Current character:', html[currentPosition]);
            console.error('[sfc-parser] Context:', html.substring(Math.max(0, currentPosition - 20), currentPosition + 20));
            break;
        }
        lastPosition = currentPosition;
        // Check for opening tag
        if (html[currentPosition] === '<') {
            // Check if it's a comment
            if (peek() === '!' && peek(1) === '-' && peek(2) === '-') {
                // Skip the opening <!--
                currentPosition += 4;

                // Find the end of the comment
                let commentContent = '';
                while (!isEOF() && !(html[currentPosition] === '-' && peek() === '-' && peek(1) === '>')) {
                    commentContent += consume();
                }

                // Skip the closing -->
                if (!isEOF()) {
                    currentPosition += 3;
                }

                // Add comment token
                tokens.push({
                    type: 'Comment',
                    content: commentContent
                });

                continue;
            }

            // Check if it's a closing tag
            if (peek() === '/') {
                // Skip the opening </
                currentPosition += 2;

                // Get the tag name
                const tagName = consumeWhile(c => c !== '>');

                // Skip the closing >
                if (!isEOF()) {
                    currentPosition++;
                }

                // Add closing tag token
                tokens.push({
                    type: 'CloseTag',
                    name: tagName.trim()
                });

                continue;
            }

            // It's an opening tag
            // Skip the opening <
            currentPosition++;

            // Get the tag name
            const tagName = consumeWhile(c => c !== ' ' && c !== '>' && c !== '/');

            // Parse attributes
            const attrs = {};

            // Skip whitespace
            consumeWhile(c => c === ' ' || c === '\n' || c === '\t' || c === '\r');

            // Parse attributes until we reach the end of the tag
            while (!isEOF() && peek() !== '>' && peek() !== '/') {
                // Get attribute name
                const attrName = consumeWhile(c => c !== '=' && c !== ' ' && c !== '>' && c !== '/');

                // Skip whitespace
                consumeWhile(c => c === ' ' || c === '\n' || c === '\t' || c === '\r');

                // Check if there's a value
                if (peek() === '=') {
                    // Skip the =
                    consume();

                    // Skip whitespace
                    consumeWhile(c => c === ' ' || c === '\n' || c === '\t' || c === '\r');

                    // Check if the value is quoted
                    let attrValue;
                    if (peek() === '"' || peek() === "'") {
                        const quote = consume();
                        attrValue = consumeWhile(c => c !== quote);

                        // Skip the closing quote
                        if (!isEOF()) {
                            consume();
                        }
                    } else {
                        // Unquoted value
                        attrValue = consumeWhile(c => c !== ' ' && c !== '>' && c !== '/');
                    }

                    // Add the attribute
                    attrs[attrName.trim()] = attrValue;
                } else {
                    // Boolean attribute
                    attrs[attrName.trim()] = true;
                }

                // Skip whitespace
                consumeWhile(c => c === ' ' || c === '\n' || c === '\t' || c === '\r');
            }

            // Check if it's a self-closing tag
            const selfClosing = peek() === '/';
            if (selfClosing) {
                // Skip the /
                consume();
            }

            // Skip the closing >
            if (!isEOF()) {
                consume();
            }

            // Add opening tag token
            tokens.push({
                type: 'OpenTag',
                name: tagName.trim(),
                attrs,
                selfClosing
            });

            continue;
        }

        // Check for template expressions {{ ... }}
        if (html[currentPosition] === '{' && peek() === '{') {
            // Skip the opening {{
            currentPosition += 2;

            // Get the expression content
            let expressionContent = '';
            while (!isEOF() && !(html[currentPosition] === '}' && peek() === '}')) {
                expressionContent += consume();
            }

            // Skip the closing }}
            if (!isEOF()) {
                currentPosition += 2;
            }

            // Add expression token
            tokens.push({
                type: 'Expression',
                content: expressionContent.trim()
            });

            continue;
        }

        // It's text content
        let textContent = '';
        while (!isEOF() && html[currentPosition] !== '<' && !(html[currentPosition] === '{' && peek() === '{')) {
            textContent += consume();
        }

        // Add text token if not empty
        if (textContent.trim()) {
            tokens.push({
                type: 'Text',
                content: textContent
            });
        }
    }

    return tokens;
}

/**
 * Builds an AST from a stream of tokens
 * @private
 * @param {Array} tokens - Array of tokens
 * @returns {Object} Root element node
 */
function buildAST(tokens) {
    // Create a stack to keep track of the current element
    const stack = [];
    let currentElement = null;
    let rootElement = null;

    // Process each token
    for (const token of tokens) {
        switch (token.type) {
            case 'OpenTag':
                // Create a new element node
                const element = {
                    type: 'Element',
                    tag: token.name,
                    attrs: token.attrs,
                    children: []
                };

                // If this is a self-closing tag, don't push to the stack
                if (!token.selfClosing) {
                    stack.push(element);
                }

                // If we have a current element, add this as a child
                if (currentElement) {
                    currentElement.children.push(element);
                } else {
                    // This is the root element
                    rootElement = element;
                }

                // Update the current element if not self-closing
                if (!token.selfClosing) {
                    currentElement = element;
                }
                break;

            case 'CloseTag':
                // Pop the current element from the stack
                stack.pop();

                // Update the current element
                currentElement = stack.length > 0 ? stack[stack.length - 1] : null;
                break;

            case 'Text':
                // Add text node to the current element
                if (currentElement) {
                    currentElement.children.push({
                        type: 'Text',
                        content: token.content
                    });
                }
                break;

            case 'Expression':
                // Add expression node to the current element
                if (currentElement) {
                    currentElement.children.push({
                        type: 'Expression',
                        content: token.content
                    });
                }
                break;

            case 'Comment':
                // Add comment node to the current element
                if (currentElement) {
                    currentElement.children.push({
                        type: 'Comment',
                        content: token.content
                    });
                }
                break;
        }
    }

    return rootElement;
}