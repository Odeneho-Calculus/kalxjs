// @kalxjs/compiler - Robust Parser
// This is a more robust version of the parser with better error handling

import { parse as originalParse, parseTemplate as originalParseTemplate } from './parser.js';

/**
 * Parses a KLX single-file component with enhanced error handling
 * @param {string} source - Source code of the .klx file
 * @param {Object} options - Parsing options
 * @returns {Object} Abstract Syntax Tree (AST)
 */
export function parse(source, options = {}) {
    try {
        // First try the original parser
        return originalParse(source, options);
    } catch (originalError) {
        console.warn('[robust-parser] Original parser failed, attempting recovery:', originalError);

        // Attempt to recover from common syntax errors
        const cleanedSource = attemptSourceRecovery(source);

        // Try parsing the cleaned source
        try {
            return originalParse(cleanedSource, options);
        } catch (recoveryError) {
            // If recovery fails, throw a more descriptive error
            const error = new Error(`Failed to parse KLX component: ${recoveryError.message}`);
            error.originalError = originalError;
            error.recoveryError = recoveryError;
            error.source = source;
            throw error;
        }
    }
}

/**
 * Attempts to recover from common syntax errors in KLX files
 * @param {string} source - Original source code
 * @returns {string} Cleaned source code
 */
function attemptSourceRecovery(source) {
    let cleanedSource = source;

    // Fix unclosed tags
    cleanedSource = fixUnclosedTags(cleanedSource);

    // Fix missing quotes in attributes
    cleanedSource = fixMissingQuotes(cleanedSource);

    // Fix malformed script and style blocks
    cleanedSource = fixMalformedBlocks(cleanedSource);

    return cleanedSource;
}

/**
 * Fixes unclosed tags in the source
 * @param {string} source - Source code
 * @returns {string} Fixed source code
 */
function fixUnclosedTags(source) {
    // Simple regex to find potentially unclosed tags
    // This is a basic implementation and might need refinement
    const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;
    const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];

    const openTags = [];
    let match;
    let result = source;

    // Find all opening tags
    while ((match = tagRegex.exec(source)) !== null) {
        const tagName = match[1];
        const attributes = match[2];

        // Skip self-closing tags or tags that are already properly closed
        if (selfClosingTags.includes(tagName) || attributes.endsWith('/')) {
            continue;
        }

        // Check if there's a closing tag for this one
        const closingTagRegex = new RegExp(`</${tagName}>`, 'g');
        const hasClosingTag = closingTagRegex.test(source.slice(match.index));

        if (!hasClosingTag) {
            openTags.push({ tagName, position: match.index + match[0].length });
        }
    }

    // Add closing tags in reverse order (to close nested tags properly)
    for (let i = openTags.length - 1; i >= 0; i--) {
        const { tagName, position } = openTags[i];
        result = result.slice(0, position) + `</${tagName}>` + result.slice(position);
    }

    return result;
}

/**
 * Fixes missing quotes in attributes
 * @param {string} source - Source code
 * @returns {string} Fixed source code
 */
function fixMissingQuotes(source) {
    // Find attributes without quotes
    const attrRegex = /(\s+)([a-zA-Z][a-zA-Z0-9-]*)(\s*=\s*)([^"'\s>][^\s>]*)/g;
    return source.replace(attrRegex, '$1$2$3"$4"');
}

/**
 * Fixes malformed script and style blocks
 * @param {string} source - Source code
 * @returns {string} Fixed source code
 */
function fixMalformedBlocks(source) {
    let result = source;

    // Fix script blocks
    if (result.includes('<script>') && !result.includes('</script>')) {
        result += '\n</script>';
    }

    // Fix style blocks
    if (result.includes('<style>') && !result.includes('</style>')) {
        result += '\n</style>';
    }

    return result;
}

/**
 * Parses a template string into an AST with enhanced error handling
 * @param {string} template - Template HTML content
 * @returns {Object} Template AST
 */
export function parseTemplate(template) {
    try {
        // First try the original template parser
        return originalParseTemplate(template);
    } catch (originalError) {
        console.warn('[robust-parser] Original template parser failed, attempting recovery:', originalError);
        
        // Attempt to recover from common template syntax errors
        const cleanedTemplate = attemptTemplateRecovery(template);
        
        // Try parsing the cleaned template
        try {
            return originalParseTemplate(cleanedTemplate);
        } catch (recoveryError) {
            console.warn('[robust-parser] Template recovery failed, creating fallback AST:', recoveryError);
            
            // Return a minimal AST with an error message
            return {
                type: 'Template',
                children: [{
                    type: 'Element',
                    tag: 'div',
                    attrs: { 
                        style: 'color: red; border: 1px solid red; padding: 10px; margin: 10px 0; border-radius: 4px; background-color: #fff5f5;' 
                    },
                    children: [
                        { 
                            type: 'Element',
                            tag: 'h3',
                            attrs: {},
                            children: [{ type: 'Text', content: 'Template Parsing Error' }]
                        },
                        { 
                            type: 'Element',
                            tag: 'p',
                            attrs: {},
                            children: [{ type: 'Text', content: originalError.message }]
                        },
                        { 
                            type: 'Element',
                            tag: 'p',
                            attrs: { style: 'font-style: italic; color: #666;' },
                            children: [{ type: 'Text', content: 'The template has been replaced with this error message.' }]
                        }
                    ]
                }]
            };
        }
    }
}

/**
 * Attempts to recover from common syntax errors in template HTML
 * @param {string} template - Original template HTML
 * @returns {string} Cleaned template HTML
 */
function attemptTemplateRecovery(template) {
    let cleanedTemplate = template;
    
    // Fix unclosed tags in the template
    cleanedTemplate = fixUnclosedTags(cleanedTemplate);
    
    // Fix missing quotes in attributes
    cleanedTemplate = fixMissingQuotes(cleanedTemplate);
    
    // Fix malformed template expressions
    cleanedTemplate = fixMalformedExpressions(cleanedTemplate);
    
    return cleanedTemplate;
}

/**
 * Fixes malformed template expressions like {{ ... }}
 * @param {string} template - Template HTML
 * @returns {string} Fixed template HTML
 */
function fixMalformedExpressions(template) {
    let result = template;
    
    // Find unclosed expressions {{ without }}
    const openExprRegex = /{{([^}]*?)(?!\}\})/g;
    result = result.replace(openExprRegex, '{{$1}}');
    
    // Find expressions with mismatched braces {{{ or }}}
    const mismatchedExprRegex = /{{{([^}]*?)}}}?/g;
    result = result.replace(mismatchedExprRegex, '{{$1}}');
    
    return result;
}