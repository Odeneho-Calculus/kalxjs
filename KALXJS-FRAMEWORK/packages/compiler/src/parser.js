// @kalxjs/compiler - Robust parser for .klx files

/**
 * Parses a KLX file into an AST
 * @param {string} source - Source code of the .klx file
 * @returns {Object} AST with template, script, and style sections
 */
export function parse(source) {
    console.log('[robust-parser] Parsing KLX file');

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
    console.log('[robust-parser] Parsing template');

    // Set a maximum time for the entire parsing process (10 seconds)
    const startTime = Date.now();
    const MAX_TOTAL_TIME = 10000; // 10 seconds

    try {
        // Create the root AST node
        const ast = {
            type: 'Template',
            children: []
        };

        // Check if we've already exceeded the time limit
        if ((Date.now() - startTime) > MAX_TOTAL_TIME) {
            throw new Error('Template parsing timeout before tokenization');
        }

        // Parse the template content
        const tokens = tokenizeHTML(template.trim());

        // Check if we've exceeded the time limit after tokenization
        if ((Date.now() - startTime) > MAX_TOTAL_TIME) {
            throw new Error('Template parsing timeout after tokenization');
        }

        const rootElement = buildAST(tokens);

        if (rootElement) {
            ast.children.push(rootElement);
        } else {
            console.warn('[robust-parser] No root element found in template');
            // Create a fallback div
            ast.children.push({
                type: 'Element',
                tag: 'div',
                attrs: {},
                children: [{ type: 'Text', content: 'Failed to parse template' }]
            });
        }

        console.log('[robust-parser] Template parsing complete in', (Date.now() - startTime), 'ms');
        return ast;
    } catch (error) {
        console.error('[robust-parser] Error parsing template:', error);
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
    console.log('[robust-parser] Starting tokenization of HTML');
    console.log('[robust-parser] HTML length:', html.length);

    const tokens = [];
    let currentPosition = 0;

    // Set a maximum time for tokenization (5 seconds)
    const startTime = Date.now();
    const MAX_TIME = 5000; // 5 seconds

    // Helper function to check if we're at the end of the input
    const isEOF = () => currentPosition >= html.length;

    // Helper function to check if we've exceeded the maximum time
    const isTimeExceeded = () => (Date.now() - startTime) > MAX_TIME;

    // Helper function to peek ahead without consuming
    const peek = (n = 1) => currentPosition + n < html.length ? html[currentPosition + n] : null;

    // Helper function to consume the next character
    const consume = () => html[currentPosition++];

    // Helper function to consume characters while a condition is true
    const consumeWhile = (condition) => {
        let result = '';
        let iterations = 0;
        const MAX_ITERATIONS = 10000; // Safety limit

        while (!isEOF() && condition(peek(0)) && iterations < MAX_ITERATIONS && !isTimeExceeded()) {
            result += consume();
            iterations++;
        }

        if (iterations >= MAX_ITERATIONS) {
            console.warn('[robust-parser] Reached maximum iterations in consumeWhile');
        }

        return result;
    };

    // Process the HTML string
    let mainLoopIterations = 0;
    const MAX_MAIN_ITERATIONS = 10000; // Safety limit

    while (!isEOF() && mainLoopIterations < MAX_MAIN_ITERATIONS && !isTimeExceeded()) {
        mainLoopIterations++;
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
            consumeWhile(c => c === ' ' || c === '\\n' || c === '\\t' || c === '\\r');

            // Parse attributes until we reach the end of the tag
            while (!isEOF() && peek() !== '>' && peek() !== '/') {
                // Get attribute name
                const attrName = consumeWhile(c => c !== '=' && c !== ' ' && c !== '>' && c !== '/');

                // Skip whitespace
                consumeWhile(c => c === ' ' || c === '\\n' || c === '\\t' || c === '\\r');

                // Check if there's a value
                if (peek() === '=') {
                    // Skip the =
                    consume();

                    // Skip whitespace
                    consumeWhile(c => c === ' ' || c === '\\n' || c === '\\t' || c === '\\r');

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
                consumeWhile(c => c === ' ' || c === '\\n' || c === '\\t' || c === '\\r');
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

    // Check if we hit any limits
    if (mainLoopIterations >= MAX_MAIN_ITERATIONS) {
        console.warn('[robust-parser] Reached maximum main loop iterations');
    }

    if (isTimeExceeded()) {
        console.warn('[robust-parser] Tokenization exceeded maximum time limit');
    }

    console.log('[robust-parser] Tokenization complete, generated', tokens.length, 'tokens');
    return tokens;
}

/**
 * Builds an AST from a stream of tokens
 * @private
 * @param {Array} tokens - Array of tokens
 * @returns {Object} Root element node
 */
function buildAST(tokens) {
    console.log('[robust-parser] Building AST from', tokens.length, 'tokens');

    // Create a stack to keep track of the current element
    const stack = [];
    let currentElement = null;
    let rootElement = null;

    // Set a maximum time for AST building (5 seconds)
    const startTime = Date.now();
    const MAX_TIME = 5000; // 5 seconds

    // Process each token
    let tokenIndex = 0;
    const MAX_TOKENS = 10000; // Safety limit

    for (const token of tokens) {
        // Check if we've exceeded limits
        if (tokenIndex >= MAX_TOKENS || (Date.now() - startTime) > MAX_TIME) {
            console.warn('[robust-parser] Reached limit while building AST');
            break;
        }

        tokenIndex++;
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

                // Update the current element to the parent
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
                // Ignore comments for now
                break;
        }
    }

    // Check if we hit any limits
    if (tokenIndex >= MAX_TOKENS) {
        console.warn('[robust-parser] Processed maximum number of tokens');
    }

    if ((Date.now() - startTime) > MAX_TIME) {
        console.warn('[robust-parser] AST building exceeded maximum time limit');
    }

    console.log('[robust-parser] AST building complete');
    return rootElement;
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