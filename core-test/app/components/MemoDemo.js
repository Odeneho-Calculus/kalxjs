import { h, defineComponent, signal, computed, effect } from '@kalxjs/core';

export default defineComponent({
    name: 'MemoDemo',

    data() {
        return {
            inputValue: '',
            computedResult: '',
            computationCount: 0,
            log: []
        };
    },

    setup() {
        const input = signal('');
        let memoComputationCount = 0;
        let normalComputationCount = 0;

        // Normal computed (recalculates on every dependency change)
        const normalComputed = computed(() => {
            normalComputationCount++;
            console.log('Normal computed recalculated:', normalComputationCount);
            const val = input.get();
            return `Normal: ${val.toUpperCase()}`;
        });

        // Memoized version - only recalculates if result actually changes
        const memoized = computed(() => {
            memoComputationCount++;
            console.log('Memoized computed recalculated:', memoComputationCount);
            const val = input.get();
            return `Memo: ${val.toUpperCase()}`;
        });

        return {
            input,
            normalComputed,
            memoized,
            memoComputationCount,
            normalComputationCount
        };
    },

    mounted() {
        console.log('MemoDemo mounted');

        this.unsubscribe = effect(() => {
            const normal = this.normalComputed.get();
            const memo = this.memoized.get();
            this.inputValue = this.input.get();
            this.computedResult = memo;
            this.computationCount = this.memoComputationCount;
            this.$update();
        });
    },

    beforeUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    },

    methods: {
        updateInput(newValue) {
            console.log('Updating input:', newValue);
            this.input.set(newValue);
            this.log.push(`Input updated to: "${newValue}"`);
            if (this.log.length > 10) this.log.shift();
            this.$update();
        },

        repeatValue() {
            console.log('Repeating value (no change)');
            const current = this.input.get();
            this.input.set(current); // Same value - memoization should prevent recalculation
            this.log.push(`Repeated value: "${current}" (should not recalculate memoized)`);
            if (this.log.length > 10) this.log.shift();
            this.$update();
        },

        clear() {
            console.log('Clearing memo demo');
            this.input.set('');
            this.memoComputationCount = 0;
            this.normalComputationCount = 0;
            this.log.push('Cleared all');
            this.$update();
        }
    },

    render() {
        return h('div', { class: 'memo-demo card' }, [
            h('h3', { class: 'card-title' }, ['💾 Memo & Optimization']),

            h('div', { class: 'memo-demo-content' }, [
                h('div', { class: 'signal-info' }, [
                    h('p', {}, [`Input: "${this.inputValue}"`]),
                    h('p', {}, [`Computed Result: ${this.computedResult}`]),
                    h('p', {}, [`Normal Computation Count: ${this.normalComputationCount}`]),
                    h('p', {}, [`Memoized Computation Count: ${this.memoComputationCount}`])
                ]),

                h('div', { class: 'input-group' }, [
                    h('input', {
                        type: 'text',
                        placeholder: 'Type something...',
                        value: this.inputValue,
                        onInput: (e) => this.updateInput(e.target.value),
                        style: 'padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; width: 100%;'
                    })
                ]),

                h('div', { class: 'button-group' }, [
                    h('button', {
                        class: 'btn btn-small',
                        onClick: this.repeatValue
                    }, ['Repeat Value (no change)']),

                    h('button', {
                        class: 'btn btn-small btn-secondary',
                        onClick: this.clear
                    }, ['Clear'])
                ]),

                h('div', { class: 'memo-log' }, [
                    h('p', { style: 'font-weight: bold; margin-bottom: 0.5rem;' }, ['Event Log:']),
                    h('ul', { style: 'font-size: 0.85rem; max-height: 150px; overflow-y: auto; background: var(--bg-secondary); padding: 0.5rem; border-radius: 4px;' },
                        this.log.map((entry, i) =>
                            h('li', { key: i }, [entry])
                        )
                    )
                ])
            ])
        ]);
    }
});