import { h, defineComponent, signal, effect } from '@kalxjs/core';

export default defineComponent({
    name: 'SignalDemo',

    data() {
        return {
            signalValue: 0,
            renderCount: 0,
            updateLog: []
        };
    },

    setup() {
        // Create signals for fine-grained reactivity
        const counter = signal(0);
        const message = signal('Initial message');
        const subscribers = [];

        return {
            counter,
            message,
            subscribers
        };
    },

    mounted() {
        // Subscribe to counter changes to track updates
        console.log('SignalDemo mounted - counter signal value:', this.counter.get());

        // Set up an effect to log changes
        this.unsubscribe = effect(() => {
            const value = this.counter.get();
            console.log('Signal effect triggered - counter value:', value);
            this.signalValue = value;
            this.$update();
        });
    },

    beforeUnmount() {
        // Cleanup subscription
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    },

    methods: {
        incrementSignal() {
            console.log('Incrementing signal');
            this.counter.update(v => v + 1);
            this.renderCount++;
            this.updateLog.push(`Signal incremented to ${this.counter.get()}`);
            this.$update();
        },

        decrementSignal() {
            console.log('Decrementing signal');
            this.counter.update(v => v - 1);
            this.renderCount++;
            this.updateLog.push(`Signal decremented to ${this.counter.get()}`);
            this.$update();
        },

        resetSignal() {
            console.log('Resetting signal');
            this.counter.set(0);
            this.renderCount++;
            this.updateLog.push('Signal reset to 0');
            this.$update();
        },

        updateMessage(newMsg) {
            console.log('Updating message signal:', newMsg);
            this.message.set(newMsg);
            this.$update();
        }
    },

    render() {
        return h('div', { class: 'signal-demo card' }, [
            h('h3', { class: 'card-title' }, ['📡 Signal Creation & Updates']),

            h('div', { class: 'signal-demo-content' }, [
                h('div', { class: 'signal-info' }, [
                    h('p', {}, [`Current Signal Value: ${this.signalValue}`]),
                    h('p', {}, [`Render Count: ${this.renderCount}`]),
                    h('p', {}, [`Message: "${this.message.get()}"`])
                ]),

                h('div', { class: 'button-group' }, [
                    h('button', {
                        class: 'btn btn-small',
                        onClick: this.decrementSignal
                    }, ['-']),

                    h('button', {
                        class: 'btn btn-small',
                        onClick: this.incrementSignal
                    }, ['+']),

                    h('button', {
                        class: 'btn btn-small btn-secondary',
                        onClick: this.resetSignal
                    }, ['Reset'])
                ]),

                h('div', { class: 'message-update' }, [
                    h('input', {
                        type: 'text',
                        placeholder: 'Enter new message',
                        onInput: (e) => this.updateMessage(e.target.value),
                        style: 'padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; width: 100%;'
                    })
                ]),

                h('div', { class: 'update-log' }, [
                    h('p', { style: 'font-weight: bold; margin-bottom: 0.5rem;' }, ['Update Log:']),
                    h('ul', { style: 'font-size: 0.85rem; max-height: 150px; overflow-y: auto; background: var(--bg-secondary); padding: 0.5rem; border-radius: 4px;' },
                        this.updateLog.slice(-5).map((log, i) =>
                            h('li', { key: i }, [log])
                        )
                    )
                ])
            ])
        ]);
    }
});