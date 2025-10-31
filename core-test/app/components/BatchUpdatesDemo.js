import { h, defineComponent, signal, batch, effect } from '@kalxjs/core';

export default defineComponent({
    name: 'BatchUpdatesDemo',

    data() {
        return {
            counter1: 0,
            counter2: 0,
            renderCount: 0,
            batchLog: [],
            nonBatchRenderCount: 0,
            batchRenderCount: 0
        };
    },

    setup() {
        const signal1 = signal(0);
        const signal2 = signal(0);
        let localRenderCount = 0;

        return {
            signal1,
            signal2,
            localRenderCount
        };
    },

    mounted() {
        console.log('BatchUpdatesDemo mounted');

        // Set up an effect to track renders
        this.unsubscribe = effect(() => {
            const v1 = this.signal1.get();
            const v2 = this.signal2.get();
            this.counter1 = v1;
            this.counter2 = v2;
            this.renderCount++;
            this.$update();
        });
    },

    beforeUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    },

    methods: {
        updateWithoutBatch() {
            console.log('Updating signals WITHOUT batch');
            const before = this.renderCount;
            this.nonBatchRenderCount = 0;

            // These updates will trigger renders separately
            this.signal1.update(v => v + 1);
            this.nonBatchRenderCount++;

            this.signal2.update(v => v + 1);
            this.nonBatchRenderCount++;

            const after = this.renderCount;
            this.batchLog.push(`WITHOUT batch: ${this.nonBatchRenderCount} updates, ${after - before} renders`);
            this.$update();
        },

        updateWithBatch() {
            console.log('Updating signals WITH batch');
            const before = this.renderCount;
            this.batchRenderCount = 0;

            // These updates will be grouped into a single render
            batch(() => {
                this.signal1.update(v => v + 1);
                this.signal2.update(v => v + 1);
                this.batchRenderCount = 2; // 2 updates
            });

            const after = this.renderCount;
            this.batchLog.push(`WITH batch: ${this.batchRenderCount} updates, ${after - before} render(s)`);
            this.$update();
        },

        resetBoth() {
            console.log('Resetting batch demo');
            batch(() => {
                this.signal1.set(0);
                this.signal2.set(0);
            });
            this.renderCount = 0;
            this.batchLog.push('Reset all signals');
            this.$update();
        }
    },

    render() {
        return h('div', { class: 'batch-demo card' }, [
            h('h3', { class: 'card-title' }, ['⚡ Batch Updates']),

            h('div', { class: 'batch-demo-content' }, [
                h('div', { class: 'signal-info' }, [
                    h('p', {}, [`Signal 1: ${this.counter1}, Signal 2: ${this.counter2}`]),
                    h('p', {}, [`Total Renders: ${this.renderCount}`]),
                    h('p', {}, [`Last non-batch updates: ${this.nonBatchRenderCount}`]),
                    h('p', {}, [`Last batch updates: ${this.batchRenderCount}`])
                ]),

                h('div', { class: 'button-group' }, [
                    h('button', {
                        class: 'btn btn-small',
                        onClick: this.updateWithoutBatch
                    }, ['Update Without Batch']),

                    h('button', {
                        class: 'btn btn-small',
                        onClick: this.updateWithBatch
                    }, ['Update With Batch']),

                    h('button', {
                        class: 'btn btn-small btn-secondary',
                        onClick: this.resetBoth
                    }, ['Reset'])
                ]),

                h('div', { class: 'batch-log' }, [
                    h('p', { style: 'font-weight: bold; margin-bottom: 0.5rem;' }, ['Batch Log:']),
                    h('ul', { style: 'font-size: 0.85rem; max-height: 150px; overflow-y: auto; background: var(--bg-secondary); padding: 0.5rem; border-radius: 4px;' },
                        this.batchLog.slice(-5).map((log, i) =>
                            h('li', { key: i }, [log])
                        )
                    )
                ])
            ])
        ]);
    }
});