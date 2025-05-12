const create = require('./create');
const serve = require('./serve');

// Placeholder implementations for missing commands
const component = (name, options) => {
    console.log(`Component generation for "${name}" is not yet implemented.`);
    console.log('Options:', options);
};

const build = (options) => {
    console.log('Build command is not yet implemented.');
    console.log('Options:', options);
};

module.exports = {
    create,
    serve,
    component,
    build
};