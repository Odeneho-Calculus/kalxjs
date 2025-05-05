import { defineComponent, h } from '@kalxjs/core';

export default defineComponent({
    name: 'Home',
    setup() {
        return () => h('div', { class: 'home' }, 'Welcome to kalxjs');
    }
});
