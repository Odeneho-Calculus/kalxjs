import { h, defineComponent } from '@kalxjs/core';

export default defineComponent({
  name: 'AboutView',
  
  render() {
    return h('div', { class: 'about-view' }, [
      h('h1', {}, ['About KalxJS']),
      h('div', { class: 'about-content' }, [
        h('p', {}, ['KalxJS is a modern JavaScript framework for building user interfaces.']),
        h('p', {}, ['It features a reactive component system, virtual DOM, and a modular architecture.']),
        
        h('h2', {}, ['Key Features']),
        h('ul', { class: 'features-list' }, [
          h('li', {}, ['Virtual DOM for efficient updates']),
          h('li', {}, ['Reactive data binding']),
          h('li', {}, ['Component-based architecture']),
          h('li', {}, ['Single-file components']),
          h('li', {}, ['Built-in routing system']),
          h('li', {}, ['State management'])
        ])
      ]),
      
      h('div', { class: 'navigation' }, [
        h('a', { href: '/', onClick: (e) => {
          e.preventDefault();
          window.router.push('/');
        }}, ['Back to Home'])
      ])
    ]);
  }
});