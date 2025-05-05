import {
    defineComponent, h
} from '@kalxjs/core';

export default defineComponent({
    name: 'HelloWorld',

    props: {
        message: {
            type: String,
            default: 'Hello World'
        }
    },

    data() {
        return {
            count: 0
        };
    },

    methods: {
        increment() {
            this.count++;
        }
    },

    render() {
        return h('div',
            {
                class: 'hello-world'
            },
            [
                h('h2',
                    {},
                    [this.message
                    ]),
                h('p',
                    {},
                    [`Count: ${this.count
                        }`
                    ]),
                h('button',
                    {
                        onClick: this.increment
                    },
                    ['Increment'
                    ])
            ]);
    }
});
