// Counter component using the new JS-based approach
import { h, reactive } from '@kalxjs/core';
import { defineJsComponent, createStyles } from '@kalxjs/core/component/js-component';

// Define component styles
const styles = createStyles(`
.counter-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.counter-value {
  font-size: 6rem;
  font-weight: bold;
  color: #42b883;
}

.counter-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.counter-button {
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
  font-weight: bold;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

.counter-button.increment {
  background-color: #42b883;
  color: white;
}

.counter-button.decrement {
  background-color: #e74c3c;
  color: white;
}

.counter-button.reset {
  background-color: #7f8c8d;
  color: white;
  font-size: 0.9rem;
}

.counter-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #35495e;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.updated {
  animation: pulse 0.3s ease;
}
`);

// Define the counter component
export default defineJsComponent({
  name: 'CounterComponent',
  
  setup() {
    // Component state
    const state = reactive({
      count: 0,
      isAnimating: false
    });
    
    // Computed properties
    function doubleCount() {
      return state.count * 2;
    }
    
    function isEven() {
      return state.count % 2 === 0 ? 'Yes' : 'No';
    }
    
    // Methods
    function increment() {
      state.count++;
      animateValue();
    }
    
    function decrement() {
      state.count--;
      animateValue();
    }
    
    function reset() {
      state.count = 0;
      animateValue();
    }
    
    function animateValue() {
      state.isAnimating = true;
      setTimeout(() => {
        state.isAnimating = false;
      }, 300);
    }
    
    // Lifecycle hooks
    function mounted() {
      console.log('Counter component mounted!');
    }
    
    // Render function
    function render() {
      return h('div', { class: 'counter-container' }, [
        h('h1', {}, ['Counter Example']),
        
        h('div', { class: `counter-value ${state.isAnimating ? 'updated' : ''}` }, [
          state.count
        ]),
        
        h('div', { class: 'counter-controls' }, [
          h('button', { 
            class: 'counter-button decrement',
            onClick: decrement
          }, ['-']),
          
          h('button', { 
            class: 'counter-button reset',
            onClick: reset
          }, ['Reset']),
          
          h('button', { 
            class: 'counter-button increment',
            onClick: increment
          }, ['+'])
        ]),
        
        h('div', { class: 'counter-stats' }, [
          h('div', { class: 'stat-item' }, [
            h('div', { class: 'stat-label' }, ['Double Count']),
            h('div', { class: 'stat-value' }, [doubleCount()])
          ]),
          
          h('div', { class: 'stat-item' }, [
            h('div', { class: 'stat-label' }, ['Is Even?']),
            h('div', { class: 'stat-value' }, [isEven()])
          ])
        ])
      ]);
    }
    
    // Return all the component's public properties and methods
    return {
      state,
      doubleCount,
      isEven,
      increment,
      decrement,
      reset,
      mounted,
      render
    };
  }
});