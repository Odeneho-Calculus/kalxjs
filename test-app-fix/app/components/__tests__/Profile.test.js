import { createComponent } from '@kalxjs/core/component';
import Profile from '../../Profile';

describe('Profile', () => {
  test('renders correctly', () => {
    // Create a test container
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Create an instance of the component
    const component = new Profile();
    component.$mount(container);

    // Check that the component renders correctly
    expect(container.querySelector('h2').textContent).toBe('Profile');

    // Clean up
    document.body.removeChild(container);
  });
});
