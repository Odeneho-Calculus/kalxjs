/**
 * Priority 7 - Native Features Demo
 * Demonstrates cross-platform native capabilities
 */

import {
    View, Text, Image, Button, TextInput, ScrollView, FlatList,
    Platform, Device, AsyncStorage, Linking, Clipboard,
    HotReloadManager
} from '@kalxjs/native';
import { ref, createApp } from '@kalxjs/core';

console.log('=== KALXJS Native Features Demo ===\n');

// 1. Platform Detection Demo
function demoPlatformDetection() {
    console.log('1. Platform Detection');
    console.log('---------------------');

    const os = Platform.getOS();
    console.log(`Operating System: ${os}`);
    console.log(`Is Mobile: ${Platform.isMobile()}`);
    console.log(`Is Desktop: ${Platform.isDesktop()}`);
    console.log(`Is iOS: ${Platform.isIOS}`);
    console.log(`Is Android: ${Platform.isAndroid}`);
    console.log(`Is Electron: ${Platform.isElectron}`);
    console.log(`Is Tauri: ${Platform.isTauri}`);
    console.log(`Is Web: ${Platform.isWeb}\n`);

    // Platform-specific styling
    const styles = Platform.select({
        ios: { paddingTop: 44 },
        android: { paddingTop: 24 },
        electron: { paddingTop: 30 },
        default: { paddingTop: 0 }
    });

    console.log('Platform-specific styles:', styles);
    console.log();
}

// 2. Component Demo
function demoComponents() {
    console.log('2. React Native-like Components');
    console.log('--------------------------------');

    const CounterApp = {
        setup() {
            const count = ref(0);
            const text = ref('');
            const items = ref([
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
                { id: 3, name: 'Item 3' }
            ]);

            const increment = () => {
                count.value++;
                console.log(`Count incremented: ${count.value}`);
            };

            const handleTextChange = (value) => {
                text.value = value;
                console.log(`Text changed: ${value}`);
            };

            return () => (
                <View style={{ padding: 20 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
                        Counter App
                    </Text>

                    <View style={{ marginTop: 20 }}>
                        <Text style={{ fontSize: 18 }}>
                            Count: {count.value}
                        </Text>
                        <Button
                            title="Increment"
                            onPress={increment}
                            style={{ marginTop: 10 }}
                        />
                    </View>

                    <View style={{ marginTop: 20 }}>
                        <TextInput
                            value={text.value}
                            onChangeText={handleTextChange}
                            placeholder="Enter text"
                            style={{
                                border: '1px solid #ccc',
                                padding: 10,
                                borderRadius: 5
                            }}
                        />
                        <Text style={{ marginTop: 10 }}>
                            You typed: {text.value}
                        </Text>
                    </View>

                    <ScrollView style={{ marginTop: 20, maxHeight: 200 }}>
                        <FlatList
                            data={items.value}
                            renderItem={(item) => (
                                <View style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                                    <Text>{item.name}</Text>
                                </View>
                            )}
                            keyExtractor={(item) => item.id}
                        />
                    </ScrollView>
                </View>
            );
        }
    };

    console.log('✓ CounterApp component created');
    console.log('✓ Components used: View, Text, Button, TextInput, ScrollView, FlatList');
    console.log();

    return CounterApp;
}

// 3. Device APIs Demo
async function demoDeviceAPIs() {
    console.log('3. Device APIs');
    console.log('--------------');

    try {
        const deviceInfo = Device.getDeviceInfo();
        console.log('Device Information:');
        console.log(`  Model: ${deviceInfo.model}`);
        console.log(`  Manufacturer: ${deviceInfo.manufacturer}`);
        console.log(`  OS Version: ${deviceInfo.osVersion}`);
        console.log(`  Platform: ${deviceInfo.platform}`);

        const batteryLevel = await Device.getBatteryLevel();
        console.log(`  Battery Level: ${(batteryLevel * 100).toFixed(0)}%`);

        const isCharging = Device.isCharging();
        console.log(`  Is Charging: ${isCharging}`);

        const networkConnected = Device.isNetworkConnected();
        console.log(`  Network Connected: ${networkConnected}`);

        console.log();
    } catch (error) {
        console.log('Device APIs demo (simulated for non-native environment)\n');
    }
}

// 4. Storage Demo
async function demoStorage() {
    console.log('4. Async Storage');
    console.log('----------------');

    try {
        // Store data
        await AsyncStorage.setItem('username', 'john_doe');
        await AsyncStorage.setItem('theme', 'dark');
        await AsyncStorage.setItem('notifications', JSON.stringify({ enabled: true }));
        console.log('✓ Stored 3 items');

        // Retrieve data
        const username = await AsyncStorage.getItem('username');
        const theme = await AsyncStorage.getItem('theme');
        const notifications = JSON.parse(await AsyncStorage.getItem('notifications') || '{}');

        console.log(`  Username: ${username}`);
        console.log(`  Theme: ${theme}`);
        console.log(`  Notifications: ${JSON.stringify(notifications)}`);

        // Get all keys
        const keys = await AsyncStorage.getAllKeys();
        console.log(`  Total keys: ${keys.length}`);

        // Remove item
        await AsyncStorage.removeItem('theme');
        console.log('✓ Removed theme item\n');

    } catch (error) {
        console.log('Storage demo (simulated)\n');
    }
}

// 5. Clipboard Demo
async function demoClipboard() {
    console.log('5. Clipboard');
    console.log('------------');

    try {
        await Clipboard.setString('Hello from KALXJS!');
        console.log('✓ Copied to clipboard');

        const text = await Clipboard.getString();
        console.log(`  Clipboard content: "${text}"`);

        const hasString = await Clipboard.hasString();
        console.log(`  Has string: ${hasString}\n`);

    } catch (error) {
        console.log('Clipboard demo (simulated)\n');
    }
}

// 6. Linking Demo
async function demoLinking() {
    console.log('6. Linking (URLs & Deep Links)');
    console.log('-------------------------------');

    try {
        const url = 'https://kalxjs.dev';
        const canOpen = await Linking.canOpenURL(url);
        console.log(`  Can open ${url}: ${canOpen}`);

        // Open URL (would open in browser/native)
        console.log(`  ✓ Would open: ${url}`);

        // Get initial URL (deep linking)
        const initialUrl = await Linking.getInitialURL();
        console.log(`  Initial URL: ${initialUrl || 'none'}\n`);

    } catch (error) {
        console.log('Linking demo (simulated)\n');
    }
}

// 7. Hot Reload Demo
function demoHotReload() {
    console.log('7. Hot Reload Manager');
    console.log('---------------------');

    const hrm = new HotReloadManager({
        enabled: true,
        preserveState: true,
        showNotifications: true
    });

    console.log(`  Status: ${hrm.isEnabled() ? 'Enabled' : 'Disabled'}`);
    console.log('  Features:');
    console.log('    • State preservation');
    console.log('    • Visual notifications');
    console.log('    • Error overlay');
    console.log('    • Component refresh\n');

    hrm.on('reload', () => {
        console.log('  → Hot reload triggered!');
    });

    hrm.on('error', (error) => {
        console.log('  → Hot reload error:', error);
    });

    return hrm;
}

// 8. Platform-Specific Features Demo
function demoPlatformSpecific() {
    console.log('8. Platform-Specific Features');
    console.log('------------------------------');

    if (Platform.isElectron) {
        console.log('  Electron Features Available:');
        console.log('    • Window management');
        console.log('    • IPC communication');
        console.log('    • File system access');
        console.log('    • Native dialogs');
        console.log('    • Menu bar');
    } else if (Platform.isTauri) {
        console.log('  Tauri Features Available:');
        console.log('    • Window management');
        console.log('    • File system access');
        console.log('    • Shell commands');
        console.log('    • HTTP requests');
        console.log('    • Native dialogs');
    } else if (Platform.isMobile()) {
        console.log('  Mobile Features Available:');
        console.log('    • Camera');
        console.log('    • Geolocation');
        console.log('    • StatusBar');
        console.log('    • Share');
        console.log('    • Permissions');
    } else {
        console.log('  Web Features Available:');
        console.log('    • DOM manipulation');
        console.log('    • Browser APIs');
        console.log('    • Service Workers');
        console.log('    • Web Storage');
    }
    console.log();
}

// Run all demos
async function runAllDemos() {
    try {
        demoPlatformDetection();
        console.log('='.repeat(50) + '\n');

        const app = demoComponents();
        console.log('='.repeat(50) + '\n');

        await demoDeviceAPIs();
        console.log('='.repeat(50) + '\n');

        await demoStorage();
        console.log('='.repeat(50) + '\n');

        await demoClipboard();
        console.log('='.repeat(50) + '\n');

        await demoLinking();
        console.log('='.repeat(50) + '\n');

        demoHotReload();
        console.log('='.repeat(50) + '\n');

        demoPlatformSpecific();

        console.log('='.repeat(50));
        console.log('✓ All native features demonstrated successfully!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('Demo error:', error);
    }
}

// Run demos
runAllDemos();