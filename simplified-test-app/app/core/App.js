import { h, defineComponent, ref, onMounted, onBeforeUnmount, computed, watch } from '@kalxjs/core';
import { useRouter } from '@kalxjs/router';
import '../styles/app.scss';

export default defineComponent({
  name: 'App',

  setup() {
    const navigateTo = (path) => {
      if (window.router) {
        window.router.push(path);
      }
    };

    // Create a local reactive route state that will be updated by router listeners
    const currentPath = ref('/');

    // Use the router hook to get reactive route state (for fallback)
    const { route } = useRouter();

    // Compute active classes reactively based on the local currentPath state
    const homeClass = computed(() => {
      return currentPath.value === '/' ? 'nav-link active' : 'nav-link';
    });

    const aboutClass = computed(() => {
      return currentPath.value === '/about' ? 'nav-link active' : 'nav-link';
    });

    let popstateListener = null;

    onMounted(() => {
      console.log('App onMounted called');

      // Set initial path from current location
      const hash = window.location.hash.slice(1);
      currentPath.value = hash || '/';
      console.log('Initial path set to:', currentPath.value);

      // Listen to router afterEach to update our local route state
      if (window.router && window.router.afterEach) {
        window.router.afterEach((to, from) => {
          console.log('Router afterEach fired: from', from.path, 'to', to.path);
          currentPath.value = to.path;
          console.log('currentPath updated to:', currentPath.value);
        });
      }

      // Listen to popstate for browser back/forward buttons
      popstateListener = () => {
        const hash = window.location.hash.slice(1);
        const newPath = hash || '/';
        console.log('Popstate event fired, new path:', newPath);
        currentPath.value = newPath;
      };
      window.addEventListener('popstate', popstateListener);
    });

    // Cleanup listeners on component unmount
    onBeforeUnmount(() => {
      console.log('App onBeforeUnmount called');
      if (popstateListener) {
        window.removeEventListener('popstate', popstateListener);
      }
    });

    return {
      navigateTo,
      currentPath,
      route,
      homeClass,
      aboutClass
    };
  },

  render() {
    // Read the computed values to establish reactivity
    const _homeClass = this.homeClass.value;
    const _aboutClass = this.aboutClass.value;
    const currentPathValue = this.currentPath.value;

    console.log('App.render() called. currentPath:', currentPathValue, 'homeClass:', _homeClass, 'aboutClass:', _aboutClass);

    return h('div', { class: 'app' }, [
      // Header
      h('header', { class: 'app-header' }, [
        h('div', { class: 'logo-container' }, [
          h('h1', { class: 'app-title' }, ['simplified-test-app'])
        ]),

        h('nav', { class: 'app-nav' }, [
          h('a', {
            href: '/',
            class: _homeClass,
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/');
            }
          }, ['Home']),
          h('a', {
            href: '/about',
            class: _aboutClass,
            onClick: (e) => {
              e.preventDefault();
              this.navigateTo('/about');
            }
          }, ['About']),
          h('a', {
            href: 'https://github.com/Odeneho-Calculus/kalxjs',
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'github-link',
            title: 'View on GitHub'
          }, ['🐙 GitHub'])
        ])
      ]),

      // Main content
      h('main', { class: 'app-main' }, [
        h('section', { id: 'router-view' })
      ]),

      // Footer
      h('footer', { class: 'app-footer' }, [
        h('p', {}, ['© 2024 Powered by KalxJS'])
      ])
    ]);
  }
});