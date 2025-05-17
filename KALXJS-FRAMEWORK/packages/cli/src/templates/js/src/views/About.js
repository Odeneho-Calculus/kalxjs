import { defineComponent, h } from '@kalxjs/core';

export default defineComponent({
    name: 'About',
    setup() {
        return () => h('div', { class: 'about' }, 'This is the About view');
    }
});