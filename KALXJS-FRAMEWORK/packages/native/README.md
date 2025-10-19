# @kalxjs/native

Cross-platform native support for KalxJS Framework - Build mobile and desktop apps with React Native-like API.

## Features

- 📱 **Mobile Support** - iOS and Android with React Native-like components
- 🖥️ **Desktop Support** - Windows, macOS, Linux with Electron and Tauri
- 🎨 **Universal Components** - View, Text, Image, ScrollView, Button, etc.
- 🔌 **Native APIs** - Camera, Geolocation, Storage, Clipboard, etc.
- 🔄 **Hot Reload** - Fast refresh across all platforms
- 🌉 **Native Bridge** - Call native modules from JavaScript
- 🎯 **Platform Detection** - Automatic platform-specific code

## Installation

```bash
npm install @kalxjs/native

# For Electron
npm install electron --save-optional

# For Tauri
npm install @tauri-apps/api --save-optional
```

## Quick Start

### Basic App

```javascript
import { View, Text, Button } from '@kalxjs/native';
import { createApp } from '@kalxjs/core';

const App = {
  setup() {
    const handlePress = () => {
      console.log('Button pressed!');
    };

    return () => (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24 }}>Hello Native!</Text>
        <Button title="Press Me" onPress={handlePress} />
      </View>
    );
  }
};

createApp(App).mount('#app');
```

### Platform Detection

```javascript
import { Platform } from '@kalxjs/native';

if (Platform.isIOS) {
  console.log('Running on iOS');
} else if (Platform.isAndroid) {
  console.log('Running on Android');
} else if (Platform.isElectron) {
  console.log('Running on Electron');
}

const os = Platform.getOS(); // 'ios', 'android', 'windows', 'macos', 'linux', 'web'
```

## Components

### View

```javascript
import { View } from '@kalxjs/native';

<View style={{ flexDirection: 'row', padding: 10 }}>
  {/* content */}
</View>
```

### Text

```javascript
import { Text } from '@kalxjs/native';

<Text style={{ color: 'blue', fontSize: 18 }}>
  Hello World
</Text>
```

### Image

```javascript
import { Image } from '@kalxjs/native';

<Image
  src="https://example.com/image.png"
  style={{ width: 200, height: 200 }}
/>
```

### ScrollView

```javascript
import { ScrollView } from '@kalxjs/native';

<ScrollView>
  {/* scrollable content */}
</ScrollView>
```

### TextInput

```javascript
import { TextInput } from '@kalxjs/native';
import { ref } from '@kalxjs/core';

const text = ref('');

<TextInput
  value={text.value}
  onChangeText={(value) => text.value = value}
  placeholder="Enter text"
/>
```

### FlatList

```javascript
import { FlatList } from '@kalxjs/native';

const items = ref([
  { id: 1, title: 'Item 1' },
  { id: 2, title: 'Item 2' }
]);

<FlatList
  data={items.value}
  renderItem={(item) => <Text>{item.title}</Text>}
  keyExtractor={(item) => item.id}
/>
```

## Native APIs

### Storage

```javascript
import { AsyncStorage } from '@kalxjs/native';

await AsyncStorage.setItem('key', 'value');
const value = await AsyncStorage.getItem('key');
await AsyncStorage.removeItem('key');
```

### Device Info

```javascript
import { Device } from '@kalxjs/native';

const info = Device.getDeviceInfo();
console.log(info.model, info.manufacturer);

const battery = await Device.getBatteryLevel();
const connected = Device.isNetworkConnected();
```

### Camera (Mobile)

```javascript
import { Camera } from '@kalxjs/native/mobile';

const photo = await Camera.takePicture({
  quality: 0.8,
  flash: 'auto'
});
console.log(photo.uri);
```

### Geolocation (Mobile)

```javascript
import { Geolocation } from '@kalxjs/native/mobile';

const position = await Geolocation.getCurrentPosition({
  enableHighAccuracy: true
});
console.log(position.coords.latitude, position.coords.longitude);
```

## Desktop Integration

### Electron

```javascript
import { Electron } from '@kalxjs/native/electron';

// Window operations
await Electron.createWindow({ width: 800, height: 600 });
Electron.minimizeWindow();
Electron.maximizeWindow();

// File dialogs
const file = await Electron.showOpenDialog({
  filters: [{ name: 'Images', extensions: ['png', 'jpg'] }]
});

// IPC Communication
Electron.on('custom-event', (data) => {
  console.log('Received:', data);
});
Electron.send('main-channel', { message: 'Hello' });
```

### Tauri

```javascript
import { Tauri } from '@kalxjs/native/tauri';

// Window operations
await Tauri.createWindow('main', { width: 800, height: 600 });
await Tauri.minimizeWindow();

// File operations
const content = await Tauri.readTextFile('path/to/file.txt');
await Tauri.writeTextFile('path/to/file.txt', 'content');

// Shell commands
const output = await Tauri.execute('ls', ['-la']);
```

## Hot Reload

```javascript
import { HotReloadManager } from '@kalxjs/native';

const hrm = new HotReloadManager({
  enabled: true,
  preserveState: true
});

hrm.enable();

hrm.on('reload', () => {
  console.log('App reloaded!');
});
```

## Platform-Specific Code

```javascript
import { Platform } from '@kalxjs/native';

const styles = Platform.select({
  ios: { paddingTop: 20 },
  android: { paddingTop: 0 },
  electron: { paddingTop: 30 },
  default: { paddingTop: 10 }
});
```

## API Reference

See [PRIORITY_7_IMPLEMENTATION.md](../../PRIORITY_7_IMPLEMENTATION.md) for complete API documentation.

## Examples

- [Mobile App](../../examples/native-mobile)
- [Electron App](../../examples/native-electron)
- [Tauri App](../../examples/native-tauri)

## License

MIT