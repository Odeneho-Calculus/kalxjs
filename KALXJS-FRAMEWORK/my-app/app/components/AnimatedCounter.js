import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
    name: 'AnimatedCounter',

    props: {
        value: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            default: 1000
        }
    },

    data() {
        return {
            displayValue: 0,
            animationId: null
        };
    },

    mounted() {
        this.animateToValue(this.value);
    },

    updated() {
        console.log('AnimatedCounter updated, value:', this.value, 'displayValue:', this.displayValue);
        // Always animate to the new value when updated
        this.animateToValue(this.value);
    },

    beforeUnmount() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    },

    methods: {
        animateToValue(targetValue) {
            // Cancel any ongoing animation
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
            }

            const startValue = this.displayValue;
            const startTime = performance.now();
            const changeInValue = targetValue - startValue;

            const animate = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / this.duration, 1);

                // Easing function (ease-out-cubic)
                const easedProgress = 1 - Math.pow(1 - progress, 3);

                this.displayValue = Math.round(startValue + changeInValue * easedProgress);
                this.$update();

                if (progress < 1) {
                    this.animationId = requestAnimationFrame(animate);
                } else {
                    this.displayValue = targetValue;
                    this.animationId = null;
                    this.$update();
                }
            };

            this.animationId = requestAnimationFrame(animate);
        }
    },

    render() {
        console.log('Rendering AnimatedCounter with value:', this.value, 'displayValue:', this.displayValue);
        
        // Force the display value to match the actual value if they're different
        // This ensures the counter always shows the correct value
        if (this.value !== this.displayValue && !this.animationId) {
            this.displayValue = this.value;
        }
        
        return h('div', { 
            class: 'animated-counter',
            style: 'font-size: 3.5rem; font-weight: bold; color: var(--primary-color); min-width: 100px; text-align: center; background-color: var(--bg-color); padding: 1rem; border-radius: 12px; box-shadow: 0 4px 10px var(--shadow-color);'
        }, [
            h('span', { 
                class: 'counter-value',
                style: 'display: inline-block; transition: transform 0.2s ease;'
            }, [String(this.displayValue)])
        ]);
    }
});