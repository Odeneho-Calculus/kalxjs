import { defineComponent, ref } from '@kalxjs/core';

export default defineComponent({
    name: 'App',
    setup() {
        const count = ref(0);

        const increment = () => {
            count.value++;
        };

        return () => ({
            tag: 'div',
            props: { class: 'app' },
            children: [
                {
                    tag: 'h1',
                    props: {},
                    children: ['Welcome to KalxJS']
                },
                {
                    tag: 'button',
                    props: {
                        onClick: increment,
                        class: 'button'
                    },
                    children: [count.value.toString()]
                }
            ].filter(Boolean)  // Ensure array is flattened properly
        });
    }
});
