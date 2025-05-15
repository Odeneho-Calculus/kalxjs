import { h, defineComponent } from '@kalxjs/core';

    export default defineComponent({
      name: 'NotFoundView',

      render() {
        return h('div', { class: 'not-found-view' }, [
          h('h1', {}, ['404 - Page Not Found']),
          h('p', {}, ['The page you are looking for does not exist.']),
          h('div', { class: 'navigation' }, [
            h('a', {
              href: '/', onClick: (e) => {
                e.preventDefault();
                window.router.push('/');
              }
            }, ['Go to Home Page'])
          ])
        ]);
      }
    }); 