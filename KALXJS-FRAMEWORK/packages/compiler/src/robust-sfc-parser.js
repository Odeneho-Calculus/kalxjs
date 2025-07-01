// @kalxjs/compiler - Robust SFC Parser for .kal files
// This parser uses a more structured approach to parse Single File Components

import { parse as parseHTML } from 'node-html-parser';

/**
 * Parses a KAL Single File Component into an AST using node-html-parser
 * @param {string} source - Source code of the .kal file
 * @returns {Object} AST with template, script, and style sections
 */
export function parseSFC(source) {
    console.log('[robust-sfc-parser] Parsing KAL file with robust parser');

    const root = parseHTML(source, {
        lowerCaseTagName: true,
        script: true,
        style: true,
        pre: true,
        comment: true
    });

    let template = null;
    let script = null;
    let style = null;
    const customBlocks = [];

    root.childNodes.forEach(node => {
        if (node.tagName === 'template') {
            template = {
                content: node.innerHTML,
                attrs: node.attributes,
                start: node.range ? node.range[0] : 0,
                end: node.range ? node.range[1] : 0
            };
            console.log(`[robust-sfc-parser] Template section found with length: ${template.content.length}`);
        } else if (node.tagName === 'script') {
            script = {
                content: node.innerHTML,
                attrs: node.attributes,
                start: node.range ? node.range[0] : 0,
                end: node.range ? node.range[1] : 0
            };
            console.log(`[robust-sfc-parser] Script section found with length: ${script.content.length}`);
        } else if (node.tagName === 'style') {
            style = {
                content: node.innerHTML,
                attrs: node.attributes,
                start: node.range ? node.range[0] : 0,
                end: node.range ? node.range[1] : 0
            };
            console.log(`[robust-sfc-parser] Style section found with length: ${style.content.length}`);
        } else if (node.tagName) {
            customBlocks.push({
                type: node.tagName,
                content: node.innerHTML,
                attrs: node.attributes,
                start: node.range ? node.range[0] : 0,
                end: node.range ? node.range[1] : 0
            });
            console.log(`[robust-sfc-parser] Custom block found: ${node.tagName}`);
        }
    });

    return {
        template,
        script,
        style,
        customBlocks,
        errors: []
    };
}
