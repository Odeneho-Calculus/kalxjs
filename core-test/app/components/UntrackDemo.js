import { h, defineComponent, signal, computed, untrack, effect } from '@kalxjs/core';

export default defineComponent({
    name: 'UntrackDemo',

    data() {
        return {
            trackedValue: 0,
            untrackedValue: 0,
            computedResult: 0,
            effectCount: 0,
            log: []
        };
    },

    setup() {
        const tracked = signal(0);
        const untrackSignal = signal(0);
        let effectTriggerCount = 0;

        // Computed with tracked dependency
        const withTracking = computed(() => {
            const value = tracked.get();
            console.log('withTracking computed recalculated');
            return value * 2;
        });

        // Computed with untracked dependency
        const withUntracking = computed(() => {
            const value = untrack(() => untrackSignal.get());
            console.log('withUntracking computed recalculated (but dependency not tracked)');
            return value * 3;
        });

        return {
            tracked,
            untrackSignal,
            withTracking,
            withUntracking,
            effectTriggerCount
        };
    },

    mounted() {
        console.log('UntrackDemo mounted');

        // Effect that depends on tracked signal
        this.unsubscribe1 = effect(() => {
            const tracked = this.tracked.get();
            const computed = this.withTracking.get();
            console.log('Effect triggered - tracked:', tracked, 'computed:', computed);
            this.trackedValue = tracked;
            this.effectCount++;
            this.log.push(`Effect triggered (tracked changed)`);
            this.$update();
        });

        // Effect that doesn't depend on untracked signal
        this.unsubscribe2 = effect(() => {
            const computed = this.withUntracking.get();
            console.log('Effect with untracking - computed:', computed);
            this.untrackedValue = computed;
        });
    },

    beforeUnmount() {
        if (this.unsubscribe1) this.unsubscribe1();
        if (this.unsubscribe2) this.unsubscribe2();
    },

    methods: {
        incrementTracked() {
            console.log('Incrementing tracked signal');
            this.tracked.update(v => v + 1);
            this.log.push('Tracked signal incremented (effect will trigger)');
            this.$update();
        },

        incrementUntracked() {
            console.log('Incrementing untracked signal');
            this.untrackSignal.update(v => v + 1);
            this.log.push('Untracked signal incremented (effect won\'t trigger)');
            this.$update();
        },

        reset() {
            console.log('Resetting untrack demo');
            this.tracked.set(0);
            this.untrackSignal.set(0);
            this.effectCount = 0;
            this.log.push('All signals reset');
            this.$update();
        }
    },

    render() {
        return h('div', { class: 'untrack-demo card' }, [
            h('h3', { class: 'card-title' }, ['🎯 Untrack Function']),

            h('div', { class: 'untrack-demo-content' }, [
                h('div', { class: 'signal-info' }, [
                    h('p', {}, [`Tracked Signal: ${this.trackedValue}`]),
                    h('p', {}, [`Untracked Computed: ${this.untrackedValue}`]),
                    h('p', {}, [`Effect Trigger Count: ${this.effectCount}`]),
                    h('p', {}, [`With Tracking Computed: ${this.withTracking.get()}`]),
                    h('p', {}, [`With Untracking Computed: ${this.withUntracking.get()}`])
                ]),

                h('div', { class: 'button-group' }, [
                    h('button', {
                        class: 'btn btn-small',
                        onClick: this.incrementTracked
                    }, ['Increment Tracked (triggers effect)']),

                    h('button', {
                        class: 'btn btn-small',
                        onClick: this.incrementUntracked
                    }, ['Increment Untracked (no effect)']),

                    h('button', {
                        class: 'btn btn-small btn-secondary',
                        onClick: this.reset
                    }, ['Reset'])
                ]),

                h('div', { class: 'untrack-log' }, [
                    h('p', { style: 'font-weight: bold; margin-bottom: 0.5rem;' }, ['Event Log:']),
                    h('ul', { style: 'font-size: 0.85rem; max-height: 150px; overflow-y: auto; background: var(--bg-secondary); padding: 0.5rem; border-radius: 4px;' },
                        this.log.slice(-5).map((entry, i) =>
                            h('li', { key: i }, [entry])
                        )
                    )
                ])
            ])
        ]);
    }
});