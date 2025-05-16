import { h, defineComponent, ref } from '@kalxjs/core';

export default defineComponent({
  name: 'TestComponent',
  
  setup() {
    const counter = ref(0);
    
    const incrementCounter = () => {
      counter.value++;
    };
    
    return {
      counter,
      incrementCounter
    };
  },
  
  render() {
    return h('div', { class: 'test-component' }, [
      h('h3', {}, ['Test Component']),
      h('p', {}, ['This is a simple test component to demonstrate component functionality.']),
      h('button', { onClick: this.incrementCounter }, [`Clicked ${this.counter} times`])
    ]);
  }
});