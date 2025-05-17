// Export the component functionality 
import { createComponent, defineComponent, createApp } from './component.js';
import { defineJsComponent, createJsComponent, createStyles } from './js-component.js';

// Export both the original component system and the new JS-based system
export {
    // Original component system (for backward compatibility)
    createComponent,
    defineComponent,
    createApp,
    
    // New JS-based component system
    defineJsComponent,
    createJsComponent,
    createStyles
};

// Enhanced defineComponent that can handle both old and new formats
export const defineComponentEnhanced = (options) => {
    // If it has a setup function, use the new JS-based system
    if (options.setup && typeof options.setup === 'function') {
        return defineJsComponent(options);
    }
    
    // Otherwise, use the original system for backward compatibility
    return defineComponent(options);
};