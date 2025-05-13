const fs = require('fs-extra');
const path = require('path');

async function processTemplates(targetDir, config) {
    const files = await fs.readdir(targetDir);

    for (const file of files) {
        const filePath = path.join(targetDir, file);
        const stats = await fs.stat(filePath);

        if (stats.isDirectory()) {
            await processTemplates(filePath, config);
        } else {
            if (file.endsWith('.template')) {
                const content = await fs.readFile(filePath, 'utf8');
                const processed = processTemplateContent(content, config);
                const newPath = filePath.replace('.template', '');
                await fs.writeFile(newPath, processed);
                await fs.remove(filePath);
            }
        }
    }
}

function processTemplateContent(content, config) {
    // Process simple variable replacements
    let processed = content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return config[key] !== undefined ? config[key] : match;
    });

    // Process if conditions
    processed = processed.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, block) => {
        return config[key] ? block : '';
    });

    // Process if-else conditions
    processed = processed.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, ifBlock, elseBlock) => {
        return config[key] ? ifBlock : elseBlock;
    });

    return processed;
}

module.exports = processTemplates;
