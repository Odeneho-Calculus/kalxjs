/**
 * Native Components
 * React Native-like components for cross-platform development
 */

import { h } from '@kalxjs/core';
import { Platform, platformStyles } from './platform.js';

/**
 * View Component - Container component (like div)
 */
export function View(props) {
    const { style, children, ...rest } = props;

    const platformStyle = platformStyles({
        base: style,
        mobile: { display: 'flex', flexDirection: 'column' }
    });

    return h('div', { style: platformStyle, ...rest }, children);
}

/**
 * Text Component - Text display
 */
export function Text(props) {
    const { style, children, numberOfLines, ellipsizeMode, ...rest } = props;

    const textStyle = {
        ...style,
        ...(numberOfLines && {
            overflow: 'hidden',
            textOverflow: ellipsizeMode || 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: numberOfLines,
            WebkitBoxOrient: 'vertical'
        })
    };

    return h('span', { style: textStyle, ...rest }, children);
}

/**
 * Image Component - Image display
 */
export function Image(props) {
    const { source, style, resizeMode, ...rest } = props;

    const imageStyle = {
        ...style,
        objectFit: resizeMode || 'cover'
    };

    const src = typeof source === 'object' ? source.uri : source;

    return h('img', { src, style: imageStyle, ...rest });
}

/**
 * ScrollView Component - Scrollable container
 */
export function ScrollView(props) {
    const { style, children, horizontal, ...rest } = props;

    const scrollStyle = {
        ...style,
        overflow: 'auto',
        ...(horizontal && { overflowX: 'auto', overflowY: 'hidden' })
    };

    return h('div', { style: scrollStyle, ...rest }, children);
}

/**
 * TextInput Component - Input field
 */
export function TextInput(props) {
    const {
        style,
        value,
        onChangeText,
        placeholder,
        secureTextEntry,
        keyboardType,
        multiline,
        numberOfLines,
        ...rest
    } = props;

    const inputType = secureTextEntry ? 'password' :
        keyboardType === 'numeric' ? 'number' :
            keyboardType === 'email-address' ? 'email' : 'text';

    const handleInput = (e) => {
        if (onChangeText) {
            onChangeText(e.target.value);
        }
    };

    const element = multiline ? 'textarea' : 'input';
    const attrs = {
        type: element === 'input' ? inputType : undefined,
        value,
        placeholder,
        onInput: handleInput,
        style,
        rows: multiline ? numberOfLines : undefined,
        ...rest
    };

    return h(element, attrs);
}

/**
 * Button Component - Pressable button
 */
export function Button(props) {
    const { title, onPress, style, color, disabled, ...rest } = props;

    const buttonStyle = {
        padding: '10px 20px',
        backgroundColor: color || '#007AFF',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style
    };

    return h('button', {
        style: buttonStyle,
        onClick: onPress,
        disabled,
        ...rest
    }, title);
}

/**
 * TouchableOpacity Component - Touchable with opacity feedback
 */
export function TouchableOpacity(props) {
    const { style, children, onPress, activeOpacity = 0.6, ...rest } = props;

    const handlePress = (e) => {
        e.currentTarget.style.opacity = activeOpacity;
        setTimeout(() => {
            e.currentTarget.style.opacity = 1;
        }, 150);

        if (onPress) {
            onPress(e);
        }
    };

    const touchableStyle = {
        ...style,
        cursor: 'pointer',
        transition: 'opacity 0.15s'
    };

    return h('div', { style: touchableStyle, onClick: handlePress, ...rest }, children);
}

/**
 * FlatList Component - Optimized list renderer
 */
export function FlatList(props) {
    const {
        data,
        renderItem,
        keyExtractor,
        style,
        ItemSeparatorComponent,
        ListHeaderComponent,
        ListFooterComponent,
        ...rest
    } = props;

    const listItems = data.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;
        const itemElement = renderItem({ item, index });

        return [
            h('div', { key }, itemElement),
            ItemSeparatorComponent && index < data.length - 1
                ? h(ItemSeparatorComponent, { key: `separator-${key}` })
                : null
        ];
    }).flat().filter(Boolean);

    return h('div', { style, ...rest }, [
        ListHeaderComponent && h(ListHeaderComponent),
        ...listItems,
        ListFooterComponent && h(ListFooterComponent)
    ]);
}

/**
 * ActivityIndicator Component - Loading spinner
 */
export function ActivityIndicator(props) {
    const { size = 'small', color = '#007AFF', style, animating = true } = props;

    if (!animating) return null;

    const spinnerSize = size === 'large' ? 40 : 20;

    const spinnerStyle = {
        width: `${spinnerSize}px`,
        height: `${spinnerSize}px`,
        border: `3px solid ${color}`,
        borderTop: '3px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        ...style
    };

    // Add keyframes if not exists
    if (typeof document !== 'undefined' && !document.getElementById('spinner-keyframes')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'spinner-keyframes';
        styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
        document.head.appendChild(styleSheet);
    }

    return h('div', { style: spinnerStyle });
}

/**
 * Modal Component - Modal dialog
 */
export function Modal(props) {
    const { visible, children, transparent, animationType, onRequestClose, style } = props;

    if (!visible) return null;

    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: transparent ? 'transparent' : 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
    };

    const contentStyle = {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '20px',
        maxWidth: '90%',
        maxHeight: '90%',
        overflow: 'auto',
        ...style
    };

    return h('div', { style: overlayStyle, onClick: onRequestClose },
        h('div', {
            style: contentStyle,
            onClick: (e) => e.stopPropagation()
        }, children)
    );
}

export default {
    View,
    Text,
    Image,
    ScrollView,
    TextInput,
    Button,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Modal
};