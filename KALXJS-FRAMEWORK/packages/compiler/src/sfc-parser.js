// @kalxjs/compiler - Enhanced SFC Parser for .kal files
// Professional-grade parser with comprehensive error handling and advanced features

/**
 * Enhanced SFC Parser for KalxJS Single File Components
 * Provides robust parsing with detailed error reporting and advanced features
 */
export class EnhancedSFCParser {
    constructor(options = {}) {
        this.options = {
            preserveWhitespace: false,
            ignoreComments: false,
            sourceMap: true,
            strictMode: true,
            ...options
        };

        this.errors = [];
        this.warnings = [];
        this.sourceLines = [];
        this.currentLine = 1;
        this.currentColumn = 1;
    }

    /**
     * Parse a KAL Single File Component source code
     * @param {string} source - Source code of the .kal file
     * @param {string} filename - Optional filename for error reporting
     * @returns {Object} Parsed SFC structure
     */
    parse(source, filename = 'anonymous.kal') {
        this.reset();
        this.sourceLines = source.split('\n');

        try {
            const result = this.parseSource(source, filename);

            // Validate the parsed result
            this.validateParsedResult(result);

            return {
                ...result,
                errors: this.errors,
                warnings: this.warnings,
                filename,
                sourceMap: this.options.sourceMap ? this.generateSourceMap(source) : null
            };
        } catch (error) {
            this.addError(`Fatal parsing error: ${error.message}`, 0, 0);

            return {
                template: null,
                script: null,
                style: null,
                customBlocks: [],
                errors: this.errors,
                warnings: this.warnings,
                filename,
                sourceMap: null
            };
        }
    }

    /**
     * Reset parser state
     * @private
     */
    reset() {
        this.errors = [];
        this.warnings = [];
        this.sourceLines = [];
        this.currentLine = 1;
        this.currentColumn = 1;
    }

    /**
     * Parse the source code into SFC blocks
     * @private
     * @param {string} source - Source code
     * @param {string} filename - Filename for error reporting
     * @returns {Object} Parsed blocks
     */
    parseSource(source, filename) {
        const blocks = this.extractBlocks(source);

        return {
            template: this.parseTemplateBlock(blocks.template),
            script: this.parseScriptBlock(blocks.script),
            style: this.parseStyleBlock(blocks.style),
            customBlocks: this.parseCustomBlocks(blocks.custom),
            filename
        };
    }

    /**
     * Extract all blocks from the source code
     * @private
     * @param {string} source - Source code
     * @returns {Object} Extracted blocks
     */
    extractBlocks(source) {
        const blocks = {
            template: [],
            script: [],
            style: [],
            custom: []
        };

        // Enhanced regex patterns for block detection
        const blockPattern = /<(template|script|style|[a-zA-Z][a-zA-Z0-9-]*)\s*([^>]*)>([\s\S]*?)<\/\1>/gi;
        let match;

        while ((match = blockPattern.exec(source)) !== null) {
            const [fullMatch, tagName, attributes, content] = match;
            const startIndex = match.index;
            const endIndex = startIndex + fullMatch.length;

            // Calculate line and column positions
            const position = this.calculatePosition(source, startIndex);

            const block = {
                type: tagName.toLowerCase(),
                content: content.trim(),
                attributes: this.parseAttributes(attributes),
                start: startIndex,
                end: endIndex,
                line: position.line,
                column: position.column,
                raw: fullMatch
            };

            // Categorize blocks
            switch (block.type) {
                case 'template':
                    blocks.template.push(block);
                    break;
                case 'script':
                    blocks.script.push(block);
                    break;
                case 'style':
                    blocks.style.push(block);
                    break;
                default:
                    blocks.custom.push(block);
            }
        }

        return blocks;
    }

    /**
     * Parse template block with validation
     * @private
     * @param {Array} templateBlocks - Template blocks
     * @returns {Object|null} Parsed template
     */
    parseTemplateBlock(templateBlocks) {
        if (templateBlocks.length === 0) {
            this.addWarning('No template block found');
            return null;
        }

        if (templateBlocks.length > 1) {
            this.addError('Multiple template blocks found. Only one template block is allowed per component.');
            return null;
        }

        const block = templateBlocks[0];

        // Validate template content
        if (!block.content.trim()) {
            this.addWarning('Template block is empty', block.line, block.column);
        }

        // Check for common template issues
        this.validateTemplateContent(block.content, block.line);

        return {
            content: block.content,
            attrs: block.attributes,
            start: block.start,
            end: block.end,
            line: block.line,
            column: block.column,
            lang: block.attributes.lang || 'html'
        };
    }

    /**
     * Parse script block with validation
     * @private
     * @param {Array} scriptBlocks - Script blocks
     * @returns {Object|null} Parsed script
     */
    parseScriptBlock(scriptBlocks) {
        if (scriptBlocks.length === 0) {
            this.addWarning('No script block found');
            return null;
        }

        if (scriptBlocks.length > 1) {
            this.addError('Multiple script blocks found. Only one script block is allowed per component.');
            return null;
        }

        const block = scriptBlocks[0];

        // Validate script content
        if (!block.content.trim()) {
            this.addWarning('Script block is empty', block.line, block.column);
        }

        // Check for setup attribute
        const isSetup = block.attributes.setup !== undefined;

        // Validate script syntax if in strict mode
        if (this.options.strictMode) {
            this.validateScriptSyntax(block.content, block.line);
        }

        return {
            content: block.content,
            attrs: block.attributes,
            start: block.start,
            end: block.end,
            line: block.line,
            column: block.column,
            lang: block.attributes.lang || 'js',
            setup: isSetup
        };
    }

    /**
     * Parse style block with validation
     * @private
     * @param {Array} styleBlocks - Style blocks
     * @returns {Object|null} Parsed style
     */
    parseStyleBlock(styleBlocks) {
        if (styleBlocks.length === 0) {
            return null;
        }

        // For now, take the first style block, but warn about multiple blocks
        if (styleBlocks.length > 1) {
            this.addWarning('Multiple style blocks found. Only the first one will be processed.');
        }

        const block = styleBlocks[0];

        // Check for scoped attribute
        const isScoped = block.attributes.scoped !== undefined;
        const isModule = block.attributes.module !== undefined;

        return {
            content: block.content,
            attrs: block.attributes,
            start: block.start,
            end: block.end,
            line: block.line,
            column: block.column,
            lang: block.attributes.lang || 'css',
            scoped: isScoped,
            module: isModule
        };
    }

    /**
     * Parse custom blocks
     * @private
     * @param {Array} customBlocks - Custom blocks
     * @returns {Array} Parsed custom blocks
     */
    parseCustomBlocks(customBlocks) {
        return customBlocks.map(block => ({
            type: block.type,
            content: block.content,
            attrs: block.attributes,
            start: block.start,
            end: block.end,
            line: block.line,
            column: block.column
        }));
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

        // Enhanced attribute parsing with support for various formats
        const attrPattern = /([a-zA-Z][a-zA-Z0-9-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
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
     * Validate template content for common issues
     * @private
     * @param {string} content - Template content
     * @param {number} startLine - Starting line number
     */
    validateTemplateContent(content, startLine) {
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const lineNumber = startLine + index;

            // Check for unclosed tags (basic validation)
            const openTags = (line.match(/<[^/][^>]*[^/]>/g) || []).length;
            const closeTags = (line.match(/<\/[^>]+>/g) || []).length;
            const selfClosingTags = (line.match(/<[^>]*\/>/g) || []).length;

            // Check for potential k-directive issues
            if (line.includes('v-')) {
                this.addWarning(`Found Vue.js directive 'v-' on line ${lineNumber}. Did you mean 'k-'?`, lineNumber);
            }

            // Check for interpolation syntax issues
            const interpolations = line.match(/\{\{[^}]*\}\}/g);
            if (interpolations) {
                interpolations.forEach(interpolation => {
                    if (interpolation.includes('{{{{') || interpolation.includes('}}}}')) {
                        this.addWarning(`Malformed interpolation syntax on line ${lineNumber}: ${interpolation}`, lineNumber);
                    }
                });
            }
        });
    }

    /**
     * Validate script syntax (basic validation)
     * @private
     * @param {string} content - Script content
     * @param {number} startLine - Starting line number
     */
    validateScriptSyntax(content, startLine) {
        try {
            // Basic syntax validation - check for common issues
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                const lineNumber = startLine + index;

                // Check for common syntax issues
                if (line.includes('export default') && !line.includes('{') && !line.includes('(')) {
                    // Check if export default is properly formatted
                    if (!line.match(/export\s+default\s+\{/) && !line.match(/export\s+default\s+\w+/)) {
                        this.addWarning(`Potentially malformed export default on line ${lineNumber}`, lineNumber);
                    }
                }
            });
        } catch (error) {
            this.addError(`Script syntax validation failed: ${error.message}`, startLine);
        }
    }

    /**
     * Validate the complete parsed result
     * @private
     * @param {Object} result - Parsed result
     */
    validateParsedResult(result) {
        // Check for required blocks
        if (!result.template && !result.script) {
            this.addError('Component must have at least a template or script block');
        }

        // Validate component structure
        if (result.script && result.script.content) {
            const hasExportDefault = result.script.content.includes('export default');
            if (!hasExportDefault) {
                this.addWarning('Script block should export a default component definition');
            }
        }
    }

    /**
     * Calculate line and column position from character index
     * @private
     * @param {string} source - Source code
     * @param {number} index - Character index
     * @returns {Object} Position object with line and column
     */
    calculatePosition(source, index) {
        const beforeIndex = source.substring(0, index);
        const lines = beforeIndex.split('\n');

        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    /**
     * Generate source map information
     * @private
     * @param {string} source - Original source code
     * @returns {Object} Source map data
     */
    generateSourceMap(source) {
        return {
            version: 3,
            sources: ['input.kal'],
            sourcesContent: [source],
            mappings: '', // Would need proper source map generation
            names: []
        };
    }

    /**
     * Add an error to the error list
     * @private
     * @param {string} message - Error message
     * @param {number} line - Line number
     * @param {number} column - Column number
     */
    addError(message, line = 0, column = 0) {
        this.errors.push({
            type: 'error',
            message,
            line,
            column,
            source: this.sourceLines[line - 1] || ''
        });
    }

    /**
     * Add a warning to the warning list
     * @private
     * @param {string} message - Warning message
     * @param {number} line - Line number
     * @param {number} column - Column number
     */
    addWarning(message, line = 0, column = 0) {
        this.warnings.push({
            type: 'warning',
            message,
            line,
            column,
            source: this.sourceLines[line - 1] || ''
        });
    }
}

/**
 * Parse a KAL Single File Component
 * @param {string} source - Source code of the .kal file
 * @param {Object} options - Parser options
 * @returns {Object} Parsed SFC structure
 */
export function parseEnhancedSFC(source, options = {}) {
    const parser = new EnhancedSFCParser(options);
    return parser.parse(source, options.filename);
}

// Export with standard name for compatibility
export function parseSFC(source, options = {}) {
    return parseEnhancedSFC(source, options);
}

/**
 * Create a parser instance with custom options
 * @param {Object} options - Parser options
 * @returns {EnhancedSFCParser} Parser instance
 */
export function createSFCParser(options = {}) {
    return new EnhancedSFCParser(options);
}