/**
 * KALXJS Core TypeScript Definitions
 * Complete type definitions for @kalxjs/core
 *
 * @module @kalxjs/core
 */

// ============================================================================
// Core Types
// ============================================================================

export type Primitive = string | number | boolean | symbol | bigint | null | undefined;

export type UnwrapRef<T> = T extends Ref<infer V> ? V : T;

export interface Ref<T = any> {
    value: T;
}

export interface ComputedRef<T = any> extends Ref<T> {
    readonly value: T;
}

export type ToRefs<T> = {
    [K in keyof T]: Ref<T[K]>;
};

// ============================================================================
// Reactivity API
// ============================================================================

export function ref<T>(value: T): Ref<UnwrapRef<T>>;
export function ref<T = any>(): Ref<T | undefined>;

export function reactive<T extends object>(target: T): T;

export function computed<T>(getter: () => T): ComputedRef<T>;
export function computed<T>(options: {
    get: () => T;
    set: (value: T) => void;
}): Ref<T>;

export function effect<T = any>(fn: () => T, options?: EffectOptions): EffectRunner;

export interface EffectOptions {
    lazy?: boolean;
    scheduler?: (job: () => void) => void;
    onTrack?: (event: DebuggerEvent) => void;
    onTrigger?: (event: DebuggerEvent) => void;
}

export interface EffectRunner {
    (): any;
    effect: ReactiveEffect;
}

export interface ReactiveEffect {
    (): any;
    _isEffect: true;
    active: boolean;
    raw: () => any;
    deps: Array<Set<ReactiveEffect>>;
    options: EffectOptions;
}

export interface DebuggerEvent {
    effect: ReactiveEffect;
    target: object;
    type: 'get' | 'set' | 'add' | 'delete' | 'clear';
    key: any;
    newValue?: any;
    oldValue?: any;
}

export function readonly<T extends object>(target: T): Readonly<T>;

export function isRef<T>(value: any): value is Ref<T>;
export function isReactive(value: unknown): boolean;
export function isReadonly(value: unknown): boolean;
export function isProxy(value: unknown): boolean;

export function toRef<T extends object, K extends keyof T>(
    object: T,
    key: K
): Ref<T[K]>;

export function toRefs<T extends object>(object: T): ToRefs<T>;

export function unref<T>(ref: T | Ref<T>): T;

// ============================================================================
// Signals API (Priority 1)
// ============================================================================

export interface Signal<T = any> {
    (): T;
    (value: T): void;
    value: T;
    peek(): T;
}

export function signal<T>(initialValue: T): Signal<T>;

export function effect(fn: () => void): () => void;

export function memo<T>(fn: () => T): Signal<T>;

export function batch(fn: () => void): void;

export function untrack<T>(fn: () => T): T;

export interface Resource<T> {
    (): T | undefined;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

export function createResource<T>(
    fetcher: () => Promise<T>,
    options?: {
        initialValue?: T;
    }
): Resource<T>;

export function createSignalStore<T extends object>(initialState: T): T;

// ============================================================================
// Component API
// ============================================================================

export interface ComponentOptions<Props = any, Data = any> {
    name?: string;
    props?: Props | string[];
    data?: () => Data;
    computed?: Record<string, ComputedOptions<any> | (() => any)>;
    methods?: Record<string, Function>;
    watch?: Record<string, WatchOptions | ((newVal: any, oldVal: any) => void)>;

    // Lifecycle hooks
    beforeCreate?(): void;
    created?(): void;
    beforeMount?(): void;
    mounted?(): void;
    beforeUpdate?(): void;
    updated?(): void;
    beforeUnmount?(): void;
    unmounted?(): void;

    // Render
    render?: (h: CreateElement) => VNode;
    template?: string;

    // Components
    components?: Record<string, Component>;

    // Other
    mixins?: ComponentOptions[];
    extends?: ComponentOptions;
    provide?: Record<string, any> | (() => Record<string, any>);
    inject?: string[] | Record<string, string | symbol>;
}

export interface ComputedOptions<T> {
    get(): T;
    set?(value: T): void;
    cache?: boolean;
}

export interface WatchOptions {
    handler(newVal: any, oldVal: any): void;
    immediate?: boolean;
    deep?: boolean;
    flush?: 'pre' | 'post' | 'sync';
}

export type Component<Props = any> = ComponentOptions<Props> | FunctionalComponent<Props>;

export interface FunctionalComponent<Props = any> {
    (props: Props, context: SetupContext): VNode | VNode[];
    props?: string[] | Record<string, PropOptions>;
    emits?: string[];
    displayName?: string;
}

export interface PropOptions<T = any> {
    type?: PropType<T> | PropType<T>[];
    required?: boolean;
    default?: T | (() => T);
    validator?(value: T): boolean;
}

export type PropType<T> = { new(...args: any[]): T } | { (): T };

export function defineComponent<Props, Data>(
    options: ComponentOptions<Props, Data>
): Component<Props>;

export function createComponent<Props>(
    options: ComponentOptions<Props>
): Component<Props>;

// ============================================================================
// Composition API
// ============================================================================

export interface SetupContext<E = Record<string, any>> {
    attrs: Record<string, any>;
    slots: Slots;
    emit: (event: string, ...args: any[]) => void;
    expose: (exposed: Record<string, any>) => void;
}

export interface Slots {
    [key: string]: Slot | undefined;
    default?: Slot;
}

export type Slot = (...args: any[]) => VNode[];

export function getCurrentInstance(): ComponentInternalInstance | null;

export interface ComponentInternalInstance {
    uid: number;
    type: Component;
    parent: ComponentInternalInstance | null;
    appContext: AppContext;
    props: Record<string, any>;
    emit: (event: string, ...args: any[]) => void;
    slots: Slots;
    refs: Record<string, any>;
    setupState: Record<string, any>;
    ctx: Record<string, any>;
    isMounted: boolean;
    isUnmounted: boolean;
}

// Lifecycle hooks
export function onMounted(hook: () => void): void;
export function onUnmounted(hook: () => void): void;
export function onBeforeMount(hook: () => void): void;
export function onBeforeUnmount(hook: () => void): void;
export function onBeforeUpdate(hook: () => void): void;
export function onUpdated(hook: () => void): void;
export function onActivated(hook: () => void): void;
export function onDeactivated(hook: () => void): void;
export function onErrorCaptured(hook: (err: Error, instance: ComponentInternalInstance | null, info: string) => boolean | void): void;

// Watch API
export type WatchSource<T = any> = Ref<T> | (() => T);

export type WatchCallback<V = any, OV = any> = (
    value: V,
    oldValue: OV,
    onCleanup: (cleanupFn: () => void) => void
) => void;

export type WatchStopHandle = () => void;

export function watch<T>(
    source: WatchSource<T>,
    callback: WatchCallback<T>,
    options?: WatchOptions
): WatchStopHandle;

export function watch<T extends readonly WatchSource[]>(
    sources: T,
    callback: WatchCallback<
        { [K in keyof T]: T[K] extends WatchSource<infer V> ? V : never },
        { [K in keyof T]: T[K] extends WatchSource<infer V> ? V : never }
    >,
    options?: WatchOptions
): WatchStopHandle;

export function watchEffect(
    effect: (onCleanup: (cleanupFn: () => void) => void) => void,
    options?: WatchOptions
): WatchStopHandle;

// Provide / Inject
export function provide<T>(key: InjectionKey<T> | string, value: T): void;
export function inject<T>(key: InjectionKey<T> | string): T | undefined;
export function inject<T>(key: InjectionKey<T> | string, defaultValue: T): T;

export interface InjectionKey<T> extends Symbol { }

// ============================================================================
// Virtual DOM
// ============================================================================

export interface VNode<Props = any> {
    type: string | Component;
    props: Props | null;
    children: VNodeChildren;
    key: string | number | symbol | null;
    ref: Ref | null;
    el: Element | null;
    shapeFlag: number;
    patchFlag: number;
}

export type VNodeChildren = string | number | boolean | VNode | VNode[] | null;

export type CreateElement = typeof h;

export function h(type: string): VNode;
export function h(type: string, props: Record<string, any>): VNode;
export function h(type: string, children: VNodeChildren): VNode;
export function h(type: string, props: Record<string, any>, children: VNodeChildren): VNode;
export function h(type: Component): VNode;
export function h(type: Component, props: Record<string, any>): VNode;
export function h(type: Component, children: VNodeChildren): VNode;
export function h(type: Component, props: Record<string, any>, children: VNodeChildren): VNode;

export function createElement(
    type: string | Component,
    props?: Record<string, any> | null,
    children?: VNodeChildren
): VNode;

// ============================================================================
// Advanced Components (Priority 1)
// ============================================================================

// Suspense
export const Suspense: Component<{
    timeout?: number;
    onResolve?: () => void;
    onPending?: () => void;
    onFallback?: () => void;
}>;

export function useSuspense(): {
    pending: Ref<boolean>;
    resolve: () => void;
    reject: (error: Error) => void;
};

// Teleport
export const Teleport: Component<{
    to: string | Element;
    disabled?: boolean;
}>;

export function usePortal(target: string | Element): {
    Portal: Component;
    isActive: Ref<boolean>;
};

// ErrorBoundary
export const ErrorBoundary: Component<{
    fallback?: Component | ((error: Error, reset: () => void) => VNode);
    onError?: (error: Error, instance: ComponentInternalInstance | null) => void;
    resetKeys?: any[];
}>;

export function useErrorHandler(): {
    error: Ref<Error | null>;
    hasError: Ref<boolean>;
    reset: () => void;
};

export function withErrorBoundary<P>(
    component: Component<P>,
    errorBoundaryProps?: Record<string, any>
): Component<P>;

// Fragment
export const Fragment: symbol;

export function createFragment(children: VNodeChildren): VNode;

export function isFragment(vnode: VNode): boolean;

// Dynamic Component
export const DynamicComponent: Component<{
    is: string | Component;
}>;

export function defineAsyncComponent<T extends Component>(
    loader: () => Promise<T>
): T;

export function defineAsyncComponent<T extends Component>(options: {
    loader: () => Promise<T>;
    loadingComponent?: Component;
    errorComponent?: Component;
    delay?: number;
    timeout?: number;
    suspensible?: boolean;
    onError?: (error: Error, retry: () => void, fail: () => void) => void;
}): T;

// KeepAlive
export const KeepAlive: Component<{
    include?: string | RegExp | string[];
    exclude?: string | RegExp | string[];
    max?: number;
}>;

// Transition
export const Transition: Component<{
    name?: string;
    mode?: 'in-out' | 'out-in' | 'default';
    appear?: boolean;
    css?: boolean;
    type?: 'transition' | 'animation';
    duration?: number | { enter: number; leave: number };
    enterFromClass?: string;
    enterActiveClass?: string;
    enterToClass?: string;
    leaveFromClass?: string;
    leaveActiveClass?: string;
    leaveToClass?: string;
}>;

export const TransitionGroup: Component<{
    tag?: string;
    moveClass?: string;
}>;

// ============================================================================
// Application API
// ============================================================================

export interface App<HostElement = any> {
    version: string;
    config: AppConfig;
    use(plugin: Plugin, ...options: any[]): this;
    mixin(mixin: ComponentOptions): this;
    component(name: string): Component | undefined;
    component(name: string, component: Component): this;
    directive(name: string): Directive | undefined;
    directive(name: string, directive: Directive): this;
    mount(rootContainer: HostElement | string): ComponentInternalInstance;
    unmount(): void;
    provide<T>(key: InjectionKey<T> | string, value: T): this;
}

export interface AppConfig {
    errorHandler?: (
        err: Error,
        instance: ComponentInternalInstance | null,
        info: string
    ) => void;
    warnHandler?: (
        msg: string,
        instance: ComponentInternalInstance | null,
        trace: string
    ) => void;
    performance?: boolean;
    globalProperties?: Record<string, any>;
}

export interface AppContext {
    app: App;
    config: AppConfig;
    mixins: ComponentOptions[];
    components: Record<string, Component>;
    directives: Record<string, Directive>;
    provides: Record<string | symbol, any>;
}

export function createApp(rootComponent: Component): App;

// ============================================================================
// Plugin API
// ============================================================================

export interface Plugin {
    install(app: App, ...options: any[]): void;
}

// ============================================================================
// Directives
// ============================================================================

export interface Directive<T = any, V = any> {
    beforeMount?(el: T, binding: DirectiveBinding<V>, vnode: VNode, prevVNode: VNode | null): void;
    mounted?(el: T, binding: DirectiveBinding<V>, vnode: VNode, prevVNode: VNode | null): void;
    beforeUpdate?(el: T, binding: DirectiveBinding<V>, vnode: VNode, prevVNode: VNode): void;
    updated?(el: T, binding: DirectiveBinding<V>, vnode: VNode, prevVNode: VNode): void;
    beforeUnmount?(el: T, binding: DirectiveBinding<V>, vnode: VNode, prevVNode: VNode | null): void;
    unmounted?(el: T, binding: DirectiveBinding<V>, vnode: VNode, prevVNode: VNode | null): void;
}

export interface DirectiveBinding<V = any> {
    value: V;
    oldValue: V | null;
    arg?: string;
    modifiers: Record<string, boolean>;
    instance: ComponentInternalInstance | null;
    dir: Directive<any, V>;
}

// ============================================================================
// SSR
// ============================================================================

export function createSSRApp(rootComponent: Component): App;

export function renderToString(app: App): Promise<string>;

export function renderToNodeStream(app: App): NodeJS.ReadableStream;

export function renderToWebStream(app: App): ReadableStream;

export function hydrate(app: App, container: Element): void;

// ============================================================================
// TypeScript Utilities
// ============================================================================

export type ExtractPropTypes<O> = O extends object
    ? { [K in keyof O]?: unknown }
    : { [K in string]: any };

export type ComponentPublicInstance<
    P = {},
    B = {},
    D = {},
    C extends ComputedOptions = {},
    M extends MethodOptions = {},
    E extends EmitsOptions = {},
    PublicProps = P
> = {
    $: ComponentInternalInstance;
    $data: D;
    $props: Readonly<P>;
    $attrs: Record<string, any>;
    $refs: Record<string, any>;
    $slots: Slots;
    $root: ComponentPublicInstance | null;
    $parent: ComponentPublicInstance | null;
    $emit: (event: string, ...args: any[]) => void;
    $el: any;
    $options: ComponentOptions;
    $forceUpdate: () => void;
    $nextTick: typeof nextTick;
    $watch(
        source: string | (() => any),
        cb: WatchCallback,
        options?: WatchOptions
    ): WatchStopHandle;
} & P & B & D & M & ExtractComputedReturns<C>;

export type ExtractComputedReturns<T extends any> = {
    [key in keyof T]: T[key] extends { get: (...args: any[]) => infer TReturn }
    ? TReturn
    : T[key] extends (...args: any[]) => infer TReturn
    ? TReturn
    : never;
};

export type MethodOptions = Record<string, Function>;

export type EmitsOptions = Record<string, any>;

export function nextTick(callback?: () => void): Promise<void>;

// ============================================================================
// Exports
// ============================================================================

export const version: string;

export default {
    version,
    createApp,
    ref,
    reactive,
    computed,
    effect,
    readonly,
    watch,
    watchEffect,
    h,
    defineComponent,
    // ... other exports
};