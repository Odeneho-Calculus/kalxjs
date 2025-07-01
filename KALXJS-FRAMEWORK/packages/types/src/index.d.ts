// @kalxjs/types - Advanced TypeScript Definitions
// Comprehensive type definitions for KalxJS framework

declare module '@kalxjs/core' {
  // Core Types
  export interface VNode {
    tag: string | ComponentConstructor | null;
    props: Record<string, any> | null;
    children: VNode[] | string | null;
    key?: string | number;
    ref?: Ref<any>;
  }

  export interface ComponentInstance {
    $el: Element | null;
    $data: Record<string, any>;
    $props: Record<string, any>;
    $options: ComponentOptions;
    $parent: ComponentInstance | null;
    $children: ComponentInstance[];
    $refs: Record<string, Element | ComponentInstance>;
    $mount(container: Element | string): ComponentInstance;
    $unmount(): void;
    $update(): void;
    $nextTick(callback?: () => void): Promise<void>;
  }

  export interface ComponentOptions<T = any> {
    name?: string;
    props?: PropDefinition<T>;
    data?: () => Record<string, any>;
    setup?: SetupFunction<T>;
    render?: RenderFunction;
    template?: string;
    components?: Record<string, ComponentConstructor>;
    directives?: Record<string, DirectiveDefinition>;
    mixins?: ComponentOptions[];
    extends?: ComponentOptions;

    // Lifecycle hooks
    beforeCreate?: () => void;
    created?: () => void;
    beforeMount?: () => void;
    mounted?: () => void;
    beforeUpdate?: () => void;
    updated?: () => void;
    beforeUnmount?: () => void;
    unmounted?: () => void;
    errorCaptured?: (error: Error, instance: ComponentInstance, info: string) => boolean | void;
  }

  export type ComponentConstructor = new (...args: any[]) => ComponentInstance;

  export type SetupFunction<T = any> = (
    props: T,
    context: SetupContext
  ) => Record<string, any> | RenderFunction | void;

  export interface SetupContext {
    attrs: Record<string, any>;
    slots: Record<string, Slot>;
    emit: (event: string, ...args: any[]) => void;
    expose: (exposed: Record<string, any>) => void;
  }

  export type RenderFunction = () => VNode | VNode[] | string | null;

  export type Slot = (...args: any[]) => VNode | VNode[] | string | null;

  // Props Types
  export type PropType<T> = PropConstructor<T> | PropConstructor<T>[];

  export type PropConstructor<T = any> =
    | { new (...args: any[]): T & {} }
    | { (): T }
    | PropMethod<T>;

  export type PropMethod<T, TConstructor = any> = [T] extends [
    ((...args: any) => any) | undefined
  ]
    ? { new (): TConstructor; (): T; readonly prototype: TConstructor }
    : never;

  export interface PropDefinition<T = any> {
    [key: string]: PropOptions<T> | PropType<T>;
  }

  export interface PropOptions<T = any> {
    type?: PropType<T>;
    required?: boolean;
    default?: T | (() => T);
    validator?: (value: T) => boolean;
  }

  // Directive Types
  export interface DirectiveDefinition {
    beforeMount?: DirectiveHook;
    mounted?: DirectiveHook;
    beforeUpdate?: DirectiveHook;
    updated?: DirectiveHook;
    beforeUnmount?: DirectiveHook;
    unmounted?: DirectiveHook;
  }

  export type DirectiveHook = (
    el: Element,
    binding: DirectiveBinding,
    vnode: VNode,
    prevVNode: VNode | null
  ) => void;

  export interface DirectiveBinding {
    value: any;
    oldValue: any;
    arg?: string;
    modifiers: Record<string, boolean>;
    instance: ComponentInstance | null;
    dir: DirectiveDefinition;
  }

  // Application API
  export interface App {
    version: string;
    config: AppConfig;
    use<T extends Plugin>(plugin: T, ...options: any[]): this;
    mixin(mixin: ComponentOptions): this;
    component(name: string): ComponentConstructor | undefined;
    component(name: string, component: ComponentConstructor): this;
    directive(name: string): DirectiveDefinition | undefined;
    directive(name: string, directive: DirectiveDefinition): this;
    mount(rootContainer: Element | string): ComponentInstance;
    unmount(): void;
    provide<T>(key: InjectionKey<T> | string, value: T): this;
    runWithContext<T>(fn: () => T): T;
  }

  export interface AppConfig {
    silent: boolean;
    performance: boolean;
    devtools: boolean;
    productionTip: boolean;
    errorHandler?: (error: Error, instance: ComponentInstance | null, info: string) => void;
    warnHandler?: (msg: string, instance: ComponentInstance | null, trace: string) => void;
    globalProperties: Record<string, any>;
    optionMergeStrategies: Record<string, Function>;
  }

  export interface Plugin {
    install(app: App, ...options: any[]): any;
  }

  // Injection API
  export interface InjectionKey<T> extends Symbol {}

  export function provide<T>(key: InjectionKey<T> | string, value: T): void;
  export function inject<T>(key: InjectionKey<T> | string): T | undefined;
  export function inject<T>(key: InjectionKey<T> | string, defaultValue: T): T;

  // Core Functions
  export function createApp(rootComponent: ComponentOptions): App;
  export function h(
    tag: string | ComponentConstructor,
    props?: Record<string, any> | null,
    children?: VNode[] | string | null
  ): VNode;
  export function createComponent(options: ComponentOptions): ComponentConstructor;
  export function defineComponent<T>(options: ComponentOptions<T>): ComponentConstructor;
  export function getCurrentInstance(): ComponentInstance | null;
  export function nextTick(callback?: () => void): Promise<void>;

  // Utility Types
  export type ExtractPropTypes<O> = {
    [K in keyof O]: InferPropType<O[K]>;
  };

  export type InferPropType<T> = T extends null
    ? any
    : T extends { type: null | true }
    ? any
    : T extends ObjectConstructor | { type: ObjectConstructor }
    ? Record<string, any>
    : T extends BooleanConstructor | { type: BooleanConstructor }
    ? boolean
    : T extends DateConstructor | { type: DateConstructor }
    ? Date
    : T extends (infer U)[]
    ? U extends DateConstructor
      ? Date | InferPropType<U>
      : InferPropType<U>
    : T extends Prop<infer V, infer D>
    ? unknown extends V
      ? IfAny<V, V, D>
      : V
    : T;

  export type Prop<T, D = T> = PropOptions<T> | PropType<T>;

  export type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N;
}

declare module '@kalxjs/core/signals' {
  // Signal Types
  export interface Signal<T = any> {
    (): T;
    (value: T): void;
    peek(): T;
    subscribe(callback: (value: T) => void): () => void;
  }

  export interface Derived<T = any> {
    (): T;
    peek(): T;
  }

  export interface Mutable<T = any> {
    value: T;
    peek(): T;
    subscribe(callback: (value: T) => void): () => void;
  }

  export interface Ref<T = any> {
    value: T;
  }

  export interface ComputedRef<T = any> extends Ref<T> {
    readonly value: T;
  }

  export interface WritableComputedRef<T> extends Ref<T> {
    readonly effect: ReactiveEffect<T>;
  }

  export interface ReactiveEffect<T = any> {
    (): T;
    active: boolean;
    deps: Dep[];
    options: ReactiveEffectOptions;
    allowRecurse: boolean;
    onStop?: () => void;
    stop(): void;
  }

  export interface ReactiveEffectOptions {
    lazy?: boolean;
    scheduler?: EffectScheduler;
    scope?: EffectScope;
    allowRecurse?: boolean;
    onStop?: () => void;
  }

  export type EffectScheduler = (...args: any[]) => any;

  export interface EffectScope {
    detached: boolean;
    active: boolean;
    effects: ReactiveEffect[];
    cleanups: (() => void)[];
    parent: EffectScope | undefined;
    scopes: EffectScope[] | undefined;
    index: number | undefined;
    run<T>(fn: () => T): T | undefined;
    stop(fromParent?: boolean): void;
  }

  export type Dep = Set<ReactiveEffect> & TrackedMarkers;

  export interface TrackedMarkers {
    w: number;
    n: number;
  }

  // Signal Functions
  export function signal<T>(initialValue: T, options?: SignalOptions): Signal<T>;
  export function derived<T>(fn: () => T, options?: DerivedOptions): Derived<T>;
  export function mutable<T>(initialValue: T, options?: SignalOptions): Mutable<T>;
  export function createEffect(fn: () => void | (() => void), options?: EffectOptions): () => void;
  export function batch<T>(fn: () => T): T;

  export interface SignalOptions {
    equals?: (a: any, b: any) => boolean;
    name?: string;
  }

  export interface DerivedOptions extends SignalOptions {}

  export interface EffectOptions {
    name?: string;
  }

  // Reactivity Functions
  export function ref<T>(value: T): Ref<T>;
  export function ref<T = any>(): Ref<T | undefined>;
  export function computed<T>(getter: () => T): ComputedRef<T>;
  export function computed<T>(options: WritableComputedOptions<T>): WritableComputedRef<T>;
  export function reactive<T extends object>(target: T): T;
  export function readonly<T>(target: T): Readonly<T>;
  export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>;
  export function isReactive(value: unknown): boolean;
  export function isReadonly(value: unknown): boolean;
  export function isProxy(value: unknown): boolean;
  export function unref<T>(ref: T | Ref<T>): T;
  export function toRef<T extends object, K extends keyof T>(object: T, key: K): Ref<T[K]>;
  export function toRefs<T extends object>(object: T): ToRefs<T>;
  export function shallowRef<T>(value: T): Ref<T>;
  export function shallowReactive<T extends object>(target: T): T;
  export function shallowReadonly<T extends object>(target: T): Readonly<T>;
  export function markRaw<T extends object>(value: T): T;
  export function toRaw<T>(observed: T): T;

  export interface WritableComputedOptions<T> {
    get: () => T;
    set: (value: T) => void;
  }

  export type ToRefs<T = any> = {
    [K in keyof T]: Ref<T[K]>;
  };

  // Watch API
  export function watch<T>(
    source: WatchSource<T>,
    callback: WatchCallback<T>,
    options?: WatchOptions
  ): WatchStopHandle;

  export function watch<T extends readonly unknown[]>(
    sources: [...T],
    callback: WatchCallback<MapSources<T>>,
    options?: WatchOptions
  ): WatchStopHandle;

  export function watchEffect(
    effect: WatchEffect,
    options?: WatchOptionsBase
  ): WatchStopHandle;

  export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T);

  export type WatchCallback<V = any, OV = any> = (
    value: V,
    oldValue: OV,
    onInvalidate: InvalidateCbRegistrator
  ) => any;

  export type WatchEffect = (onInvalidate: InvalidateCbRegistrator) => void;

  export type WatchStopHandle = () => void;

  export type InvalidateCbRegistrator = (cb: () => void) => void;

  export interface WatchOptionsBase {
    flush?: 'pre' | 'post' | 'sync';
    onTrack?: (event: DebuggerEvent) => void;
    onTrigger?: (event: DebuggerEvent) => void;
  }

  export interface WatchOptions<Immediate = boolean> extends WatchOptionsBase {
    immediate?: Immediate;
    deep?: boolean;
  }

  export type MapSources<T> = {
    [K in keyof T]: T[K] extends WatchSource<infer V>
      ? V
      : T[K] extends object
      ? T[K]
      : never;
  };

  export interface DebuggerEvent {
    effect: ReactiveEffect;
    target: object;
    type: TrackOpTypes | TriggerOpTypes;
    key: any;
    newValue?: any;
    oldValue?: any;
    oldTarget?: Map<any, any> | Set<any>;
  }

  export const enum TrackOpTypes {
    GET = 'get',
    HAS = 'has',
    ITERATE = 'iterate'
  }

  export const enum TriggerOpTypes {
    SET = 'set',
    ADD = 'add',
    DELETE = 'delete',
    CLEAR = 'clear'
  }
}

declare module '@kalxjs/core/concurrent' {
  // Concurrent Rendering Types
  export const enum Priority {
    IMMEDIATE = 1,
    NORMAL = 2,
    LOW = 3,
    IDLE = 4
  }

  export interface Task {
    id: number;
    callback: TaskCallback;
    priority: Priority;
    startTime: number;
    expirationTime: number;
    sortIndex: number;
  }

  export type TaskCallback = (didTimeout: boolean) => TaskCallback | null;

  export interface ConcurrentRenderer {
    scheduleUpdate(component: any, priority?: Priority, options?: any): Task;
    cancelUpdates(component: any): void;
  }

  export interface ConcurrentAPIType {
    scheduleImmediate(component: any, options?: any): Task;
    scheduleUpdate(component: any, options?: any): Task;
    scheduleLowPriority(component: any, options?: any): Task;
    scheduleIdle(component: any, options?: any): Task;
    cancelUpdates(component: any): void;
    batchUpdates(fn: () => void): void;
  }

  export const ConcurrentAPI: ConcurrentAPIType;

  // Suspense Types
  export interface SuspenseOptions {
    fallback?: any;
    timeout?: number;
    onTimeout?: (promise: Promise<any>) => void;
    onError?: (error: Error, retry: () => void) => void;
    retryCount?: number;
  }

  export class KalxSuspense {
    constructor(options?: SuspenseOptions);
    wrap(component: any): any;
    static create(options?: SuspenseOptions): (children: any) => any;
  }

  export interface ErrorBoundaryOptions {
    fallback?: (error: Error, errorInfo: any, retry: () => void) => any;
    onError?: (error: Error, errorInfo: any) => void;
    resetOnPropsChange?: boolean;
    resetKeys?: string[];
  }

  export class ErrorBoundary {
    constructor(options?: ErrorBoundaryOptions);
    wrap(component: any): any;
    static create(options?: ErrorBoundaryOptions): (children: any) => any;
  }

  export function withAsyncBoundary(options?: {
    suspense?: SuspenseOptions;
    errorBoundary?: ErrorBoundaryOptions;
  }): (component: any) => any;

  export const AsyncUtils: {
    createResource<T>(fetcher: (...args: any[]) => Promise<T>, initialValue?: T): any;
    lazy(loader: () => Promise<any>): any;
  };
}

declare module '@kalxjs/router' {
  // Router Types
  export interface RouteLocationNormalized {
    path: string;
    fullPath: string;
    matched: RouteRecordNormalized[];
    params: RouteParams;
    query: LocationQuery;
    hash: string;
    meta: RouteMeta;
  }

  export interface RouteRecordNormalized {
    path: string;
    component?: any;
    components?: Record<string, any>;
    name?: string;
    meta: RouteMeta;
    props?: boolean | Record<string, any> | ((route: RouteLocationNormalized) => Record<string, any>);
    children?: RouteRecordNormalized[];
    beforeEnter?: NavigationGuard;
  }

  export type RouteParams = Record<string, string | string[]>;
  export type LocationQuery = Record<string, string | string[]>;
  export type RouteMeta = Record<string | number | symbol, any>;

  export type NavigationGuard = (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => any;

  export interface NavigationGuardNext {
    (): void;
    (error: Error): void;
    (location: string): void;
    (valid: boolean): void;
  }

  export interface Router {
    currentRoute: Ref<RouteLocationNormalized>;
    push(to: string | RouteLocationRaw): Promise<void>;
    replace(to: string | RouteLocationRaw): Promise<void>;
    go(delta: number): void;
    back(): void;
    forward(): void;
    beforeEach(guard: NavigationGuard): () => void;
    beforeResolve(guard: NavigationGuard): () => void;
    afterEach(guard: (to: RouteLocationNormalized, from: RouteLocationNormalized) => any): () => void;
    install(app: App): void;
  }

  export interface RouteLocationRaw {
    path?: string;
    name?: string;
    params?: RouteParams;
    query?: LocationQuery;
    hash?: string;
  }

  export interface RouterOptions {
    history: RouterHistory;
    routes: RouteRecordRaw[];
    scrollBehavior?: (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      savedPosition: { left: number; top: number } | null
    ) => any;
  }

  export interface RouteRecordRaw {
    path: string;
    component?: any;
    components?: Record<string, any>;
    name?: string;
    meta?: RouteMeta;
    props?: boolean | Record<string, any> | ((route: RouteLocationNormalized) => Record<string, any>);
    children?: RouteRecordRaw[];
    beforeEnter?: NavigationGuard;
  }

  export interface RouterHistory {
    readonly base: string;
    readonly location: string;
    readonly state: any;
    push(to: string, data?: any): void;
    replace(to: string, data?: any): void;
    go(delta: number, triggerListeners?: boolean): void;
    listen(callback: (location: string, state: any) => void): () => void;
    createHref(location: string): string;
  }

  export function createRouter(options: RouterOptions): Router;
  export function createWebHistory(base?: string): RouterHistory;
  export function createWebHashHistory(base?: string): RouterHistory;
  export function createMemoryHistory(base?: string): RouterHistory;
  export function useRouter(): Router;
  export function useRoute(): ComputedRef<RouteLocationNormalized>;
}

declare module '@kalxjs/store' {
  // Store Types
  export interface Store<S = any> {
    readonly state: S;
    getters: any;
    commit<K extends keyof Mutations>(
      type: K,
      payload?: Parameters<Mutations[K]>[1]
    ): void;
    dispatch<K extends keyof Actions>(
      type: K,
      payload?: Parameters<Actions[K]>[1]
    ): Promise<any>;
    subscribe<P extends MutationPayload>(fn: (mutation: P, state: S) => any): () => void;
    subscribeAction<P extends ActionPayload>(fn: (action: P, state: S) => any): () => void;
    watch<T>(fn: (state: S, getters: any) => T, callback: (value: T, oldValue: T) => void): () => void;
    replaceState(state: S): void;
    registerModule<T>(path: string, module: Module<T, S>): void;
    unregisterModule(path: string): void;
    hasModule(path: string): boolean;
    hotUpdate(newOptions: {
      actions?: ActionTree<S, S>;
      mutations?: MutationTree<S>;
      getters?: GetterTree<S, S>;
      modules?: ModuleTree<S>;
    }): void;
  }

  export interface StoreOptions<S> {
    state?: S | (() => S);
    getters?: GetterTree<S, S>;
    actions?: ActionTree<S, S>;
    mutations?: MutationTree<S>;
    modules?: ModuleTree<S>;
    plugins?: Plugin<S>[];
    strict?: boolean;
    devtools?: boolean;
  }

  export interface Module<S, R> {
    namespaced?: boolean;
    state?: S | (() => S);
    getters?: GetterTree<S, R>;
    actions?: ActionTree<S, R>;
    mutations?: MutationTree<S>;
    modules?: ModuleTree<R>;
  }

  export interface ActionContext<S, R> {
    dispatch: Dispatch;
    commit: Commit;
    state: S;
    getters: any;
    rootState: R;
    rootGetters: any;
  }

  export interface MutationPayload {
    type: string;
    payload: any;
  }

  export interface ActionPayload {
    type: string;
    payload: any;
  }

  export type Getter<S, R> = (state: S, getters: any, rootState: R, rootGetters: any) => any;
  export type Action<S, R> = (injectee: ActionContext<S, R>, payload?: any) => any;
  export type Mutation<S> = (state: S, payload?: any) => any;
  export type Plugin<S> = (store: Store<S>) => any;

  export interface GetterTree<S, R> {
    [key: string]: Getter<S, R>;
  }

  export interface ActionTree<S, R> {
    [key: string]: Action<S, R>;
  }

  export interface MutationTree<S> {
    [key: string]: Mutation<S>;
  }

  export interface ModuleTree<R> {
    [key: string]: Module<any, R>;
  }

  export interface Dispatch {
    (type: string, payload?: any, options?: DispatchOptions): Promise<any>;
    <P extends Payload>(payloadWithType: P, options?: DispatchOptions): Promise<any>;
  }

  export interface Commit {
    (type: string, payload?: any, options?: CommitOptions): void;
    <P extends Payload>(payloadWithType: P, options?: CommitOptions): void;
  }

  export interface DispatchOptions {
    root?: boolean;
  }

  export interface CommitOptions {
    silent?: boolean;
    root?: boolean;
  }

  export interface Payload {
    type: string;
  }

  export function createStore<S>(options: StoreOptions<S>): Store<S>;
  export function useStore<S = any>(key?: string): Store<S>;

  // Helper functions
  export function mapState<S>(map: Array<keyof S>): { [K in keyof S]: () => S[K] };
  export function mapState<S>(map: { [key: string]: keyof S }): { [key: string]: () => any };
  export function mapGetters<S>(map: string[]): { [key: string]: () => any };
  export function mapGetters<S>(map: { [key: string]: string }): { [key: string]: () => any };
  export function mapActions<S>(map: string[]): { [key: string]: (...args: any[]) => Promise<any> };
  export function mapActions<S>(map: { [key: string]: string }): { [key: string]: (...args: any[]) => Promise<any> };
  export function mapMutations<S>(map: string[]): { [key: string]: (...args: any[]) => void };
  export function mapMutations<S>(map: { [key: string]: string }): { [key: string]: (...args: any[]) => void };
}

declare module '@kalxjs/devtools' {
  // DevTools Types
  export interface DevToolsOptions {
    autoEnable?: boolean;
    logLifecycleEvents?: boolean;
    performanceMonitoring?: boolean;
  }

  export interface DevTools {
    isEnabled(): boolean;
    enable(): void;
    disable(): void;
    registerComponent(component: any): string;
    unregisterComponent(componentId: string): void;
    getPerformanceInsights(): any;
    toggle(): void;
  }

  export interface HMRManager {
    register(id: string, component: any): void;
    update(id: string, newComponent: any): void;
    addInstance(id: string, instance: any): void;
    removeInstance(id: string, instance: any): void;
  }

  export interface TimeTravelDebugger {
    takeSnapshot(state: any, action?: string): void;
    travelTo(index: number): any;
    goBack(): any;
    goForward(): any;
    getSnapshots(): any[];
    clear(): void;
    startRecording(): void;
    stopRecording(): void;
  }

  export function initDevTools(options?: DevToolsOptions): DevTools;
  export function initEnhancedDevTools(options?: DevToolsOptions): DevTools;
  export function getDevTools(): DevTools | null;
  export function getEnhancedDevTools(): DevTools | null;
  export function getHMRManager(): HMRManager | null;
  export function getTimeTravelDebugger(): TimeTravelDebugger | null;
}

declare module '@kalxjs/build-tools' {
  // Build Tools Types
  export interface VitePluginOptions {
    include?: string | RegExp | (string | RegExp)[];
    exclude?: string | RegExp | (string | RegExp)[];
    compilerOptions?: any;
    devtools?: boolean;
    hmr?: boolean;
    ssr?: boolean;
  }

  export interface WebpackPluginOptions {
    compilerOptions?: any;
    devtools?: boolean;
    hmr?: boolean;
  }

  export function kalxjs(options?: VitePluginOptions): any;
  export class KalxJSWebpackPlugin {
    constructor(options?: WebpackPluginOptions);
    apply(compiler: any): void;
  }
  export function kalxjsRollup(options?: any): any;
  export function kalxjsESBuild(options?: any): any;
}

// Global augmentations
declare global {
  interface Window {
    __KALX_DEVTOOLS__?: any;
    __KALX_ENHANCED_DEVTOOLS__?: any;
  }
}

// Module augmentation for .kal files
declare module '*.kal' {
  import { ComponentOptions } from '@kalxjs/core';
  const component: ComponentOptions;
  export default component;
}

// JSX support
declare namespace JSX {
  interface Element extends VNode {}
  interface ElementClass {
    $props: {};
  }
  interface ElementAttributesProperty {
    $props: {};
  }
  interface IntrinsicElements {
    [elem: string]: any;
  }
  interface IntrinsicAttributes {
    key?: string | number;
    ref?: Ref<any>;
  }
}

export {};