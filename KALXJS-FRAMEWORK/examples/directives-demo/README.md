# KalxJS Directives Demo

This example project demonstrates the various directives available in the KalxJS framework. It provides interactive examples of each directive with code snippets and explanations.

## Overview

The KalxJS Directives Demo is a comprehensive guide to understanding and using directives in your KalxJS applications. It covers:

- Text manipulation directives
- Conditional rendering directives
- List rendering directives
- Form binding directives
- Event handling directives

## Directives Demonstrated

### Text Directives

- `k-text`: Updates an element's text content
- `k-html`: Updates an element's innerHTML (use with caution for security)

### Conditional Directives

- `k-if`: Conditionally renders an element
- `k-else-if`: Renders when a condition is true and previous conditions are false
- `k-else`: Renders when all previous conditions are false
- `k-show`: Toggles an element's visibility using CSS display property

### List Directives

- `k-for`: Renders elements based on arrays or objects
  - Array syntax: `k-for="(item, index) in items"`
  - Object syntax: `k-for="(value, key) in object"`

### Form Directives

- `k-model`: Two-way binding for form inputs
  - Works with text inputs, textareas, checkboxes, radio buttons, and select elements

### Event Directives

- `@event`: Event listeners (e.g., `@click`, `@input`)
- Event modifiers: `.stop`, `.prevent`, `.once`, etc.
- Key modifiers: `.enter`, `.esc`, etc.

## Project Structure

- `index.html`: Entry point for the application
- `DirectivesExplorer.kal`: Main component that provides the directive explorer interface
- `DirectiveCard.kal`: Reusable component for displaying directive examples
- `App.kal`: Alternative comprehensive demo component
- `vite.config.js`: Vite configuration for the project
- `package.json`: Project dependencies and scripts

## Running the Demo

1. Navigate to the directives-demo directory:
   ```
   cd examples/directives-demo
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. The demo will automatically open in your default browser
5. Explore the different directive categories and interact with the examples

## Building for Production

To build the demo for production:

```
npm run build
```

The built files will be in the `dist` directory and can be served with any static file server.

## Learning Path

1. Start with Text Directives to understand basic content manipulation
2. Move on to Conditional Directives to learn about dynamic rendering
3. Explore List Directives to understand how to render collections of data
4. Learn about Form Directives for user input handling
5. Finally, master Event Directives for interactive applications

## Additional Resources

- Check the `<docs>` section in each component file for detailed documentation
- Refer to the KalxJS documentation for more advanced usage
- Explore the source code to understand how directives are implemented

## Contributing

Feel free to extend this demo with additional examples or improvements to the existing ones.