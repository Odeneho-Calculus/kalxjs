import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
name: 'TestComponent',
  render() {
      return h('div', { class: "test", }, [h('h1', { }, ["Test Template"]), h('p', { }, ["This is a test template"])]);
    
  }
});

// Inject component styles
(function() {
  if (typeof document !== 'undefined') {
    // Check if style already exists
    if (!document.getElementById('klx-style-b9yjlzfq')) {
      const style = document.createElement('style');
      style.textContent = ".test {\n  color: red;\n}";
      style.setAttribute('id', 'klx-style-b9yjlzfq');
      document.head.appendChild(style);
    }
  }
})();
