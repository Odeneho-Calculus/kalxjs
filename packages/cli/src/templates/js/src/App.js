import { defineComponent, h } from '@kalxjs/core';
import HelloWorld from './components/HelloWorld';

export default defineComponent({
    name: 'App',

    data() {
        return {
            title: 'Welcome to kalxjs'
        };
    },

    render() {
        return h('div',
            {
                class: 'app'
            },
            [
                h('h1',
                    {},
                    [this.title
                    ]),
                h(HelloWorld,
                    {
                        message: 'Hello from kalxjs!'
                    })
            ]);
    }
});
