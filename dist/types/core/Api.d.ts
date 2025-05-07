export interface ICore {
    regModel<T extends IModel>(model: T): void;
    getModel<T extends IModel>(ctor: new () => T): T;
    regManager<T extends IManager>(manager: T): void;
    getManager<T extends IManager>(ctor: new () => T): T;
    getManager<T extends IManager>(symbol: symbol): T;
}
export interface IManager {
    initialize(): void;
    dispose(): void;
}
export interface IModel {
    initialize(): void;
}
export interface IView {
    onEnter(args?: any): void;
    onExit(): void;
    onPause(): void;
    onResume(): void;
}
export interface IUIManager {
    open<T extends IView>(viewType: new () => T, args?: any): Promise<T>;
    close<T extends IView>(viewortype: T | (new () => T), destory?: boolean): void;
    openAndPush<T extends IView>(viewType: new () => T, group: string, args?: any): Promise<T>;
    closeAndPop(group: string, destroy?: boolean): void;
    getTopView(): IView | undefined;
    clearStack(group: string, destroy?: boolean): void;
}
export interface IResManager {
}
export interface IEventMsgKey {
}
export type ToAnyIndexKey<IndexKey, AnyType> = IndexKey extends keyof AnyType ? IndexKey : keyof AnyType;
export type OnListenerResult<T = any> = (data?: T, callBack?: any) => void;
export type OnListener<T = any, K = any> = (value?: T, callBack?: OnListenerResult<K>, ...args: any[]) => void;
export type ListenerHandler<keyType extends keyof any = any, ValueType = any, ResultType = any> = {
    key: keyType;
    listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>;
    context?: any;
    args?: any[];
};
export interface IEventManager<MsgKeyType extends IEventMsgKey = IEventMsgKey, ValueType = any, ResultType = any> {
    on<keyType extends keyof MsgKeyType>(keyOrHandler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[], listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>, context?: any, args?: any[]): void;
    once<keyType extends keyof MsgKeyType>(keyOrHandler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[], listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>, context?: any, args?: any[]): void;
    off<keyType extends keyof MsgKeyType>(key: keyType, listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>): void;
    offAll<keyType extends keyof MsgKeyType>(key?: keyType, context?: any): void;
    dispatch<keyType extends keyof MsgKeyType>(key: keyType, data?: ValueType[ToAnyIndexKey<keyType, ValueType>], callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>, persistence?: boolean): void;
    dispatchSticky<keyType extends keyof MsgKeyType>(key: keyType, data?: ValueType[ToAnyIndexKey<keyType, ValueType>], callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>, persistence?: boolean): void;
    removeStickyBroadcast(key: keyof MsgKeyType): void;
    isRegistered(key: keyof MsgKeyType): boolean;
    getPersistentValue<keyType extends keyof MsgKeyType>(key: keyType): ValueType[ToAnyIndexKey<keyType, ValueType>] | undefined;
    dispose(): void;
}
