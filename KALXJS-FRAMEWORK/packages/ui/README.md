# @kalxjs/ui

Modern, accessible UI component library for KALXJS applications.

## Features

✨ **10+ Ready-to-Use Components** - Button, Input, Modal, Card, Alert, Badge, Tooltip, Dropdown, Tabs, and more

🎨 **Complete Design System** - Colors, typography, spacing, and shadows with light/dark mode

♿ **Accessible by Default** - WCAG 2.1 Level AA compliant, keyboard navigation, ARIA attributes

🌙 **Dark Mode Support** - Built-in theme system with easy mode switching

📱 **Responsive** - Mobile-first design with breakpoint utilities

🎯 **TypeScript Ready** - Full type definitions (coming soon)

⚡ **Tree-Shakeable** - Import only what you need

🎭 **Customizable** - Override styles and extend components easily

## Installation

```bash
npm install @kalxjs/ui @kalxjs/core @kalxjs/a11y
```

## Quick Start

### 1. Install the plugin

```javascript
import { createApp } from '@kalxjs/core';
import KalxjsUI from '@kalxjs/ui';
import '@kalxjs/ui/styles.css'; // Optional: if using pre-compiled CSS

const app = createApp(App);

// Install with default theme
app.use(KalxjsUI);

// Or install with custom theme
app.use(KalxjsUI, {
    theme: {
        mode: 'dark',
        colors: {
            primary: {
                500: '#your-color',
            },
        },
    },
});

app.mount('#app');
```

### 2. Use components

```javascript
import { Button, Input, Modal, Card } from '@kalxjs/ui';

export default {
    template: `
        <div>
            <Button variant="primary" @click="handleClick">
                Click Me
            </Button>

            <Input
                v-model="email"
                type="email"
                label="Email"
                placeholder="Enter your email"
            />

            <Modal v-model="showModal" title="Hello World">
                <p>This is a modal</p>
            </Modal>

            <Card>
                <template #header>
                    <h3>Card Title</h3>
                </template>
                <p>Card content goes here</p>
            </Card>
        </div>
    `,
};
```

## Components

### Button

Versatile button component with multiple variants and sizes.

```javascript
<Button variant="primary" size="lg" @click="handleClick">
    Primary Button
</Button>

<Button variant="outline" loading>
    Loading...
</Button>

<Button variant="danger" disabled>
    Disabled
</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost' | 'link'`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- `disabled`: `boolean`
- `loading`: `boolean`
- `fullWidth`: `boolean`

### Input

Form input with validation and helper text.

```javascript
<Input
    v-model="username"
    label="Username"
    placeholder="Enter username"
    hint="Choose a unique username"
    error="Username is required"
    required
    clearable
/>
```

**Props:**
- `type`: `'text' | 'password' | 'email' | 'number' | ...`
- `label`: `string`
- `placeholder`: `string`
- `error`: `string`
- `hint`: `string`
- `disabled`: `boolean`
- `clearable`: `boolean`
- `showPasswordToggle`: `boolean` (for password inputs)

### Modal

Accessible modal dialog with focus trap.

```javascript
<Modal
    v-model="isOpen"
    title="Confirm Action"
    size="md"
    @close="handleClose"
>
    <p>Are you sure you want to continue?</p>
    <template #footer>
        <Button @click="isOpen = false">Cancel</Button>
        <Button variant="primary" @click="confirm">Confirm</Button>
    </template>
</Modal>
```

**Props:**
- `modelValue`: `boolean`
- `title`: `string`
- `size`: `'sm' | 'md' | 'lg' | 'xl'`
- `closeOnOverlay`: `boolean`
- `closeOnEsc`: `boolean`

### Card

Container component with elevation.

```javascript
<Card variant="elevated" hoverable>
    <template #header>
        <h3>Card Title</h3>
    </template>
    <p>Card content</p>
    <template #footer>
        <Button>Action</Button>
    </template>
</Card>
```

### Alert

Feedback messages for users.

```javascript
<Alert variant="success" title="Success!" closable>
    Your changes have been saved.
</Alert>

<Alert variant="danger">
    An error occurred. Please try again.
</Alert>
```

## Theme System

### Using the theme

```javascript
import { useTheme } from '@kalxjs/ui';

export default {
    setup() {
        const { theme, toggleMode, isDark } = useTheme();

        return {
            theme,
            toggleMode,
            isDark,
        };
    },
};
```

### Custom theme

```javascript
import { createTheme, applyTheme } from '@kalxjs/ui';

const customTheme = createTheme({
    mode: 'dark',
    colors: {
        primary: '#your-color',
    },
});

applyTheme(customTheme);
```

## Composables

### useMediaQuery

```javascript
import { useMediaQuery, useIsMobile, usePrefersDark } from '@kalxjs/ui';

const isMobile = useIsMobile();
const prefersDark = usePrefersDark();
const isLarge = useMediaQuery('(min-width: 1200px)');
```

## Accessibility

All components are built with accessibility in mind:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ ARIA attributes
- ✅ Focus management
- ✅ Color contrast (WCAG AA)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guide.