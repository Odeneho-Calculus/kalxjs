import { h, createComponent } from '@kalxjs/core/component';


class Profile {
  constructor() {
    const component = createComponent({
      name: 'Profile',
      
      props: {
        title: {
          type: String,
          default: 'Profile'
        }
      },
      
      data() {
        return {
          count: 0
        };
      },
      
      methods: {
        increment() {
          this.count++;
        }
      },
      
      beforeMount() {
        // Called before component is mounted
      },

      mounted() {
        console.log('Profile mounted');
      },

      beforeUpdate() {
        // Called before component updates
      },

      updated() {
        // Called after component updates
      },
      render: this.render.bind(this)
    });

    // Copy component properties to this instance
    Object.assign(this, component);
  }

  render() {
    return h('div', { class: 'profile' }, [
      h('h2', {}, [this.title]),
      h('p', {}, [`Count: ${this.count}`]),
      h('button', { onClick: this.increment }, ['Increment']),
    ]);
  }
}

export default Profile;
