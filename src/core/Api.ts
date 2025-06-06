// regManager/regModel：管理业务领域内的具体实现
export interface ICore {
    regModel<T extends IModel>(model: T): void;
    getModel<T extends IModel>(ctor: new () => T): T;
    regManager<T extends IManager>(manager: T): void;
    getManager<T extends IManager>(ctor: new () => T): T; // 构造器模式
    getManager<T extends IManager>(symbol: symbol): T; // Symbol模式
}

// 管理器与模型基接口
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
    openAndPush<T extends IView>(viewType: new () => T, group: string, args?: any): Promise<T>
    closeAndPop(group: string, destroy?: boolean): void
    getTopView(): IView | undefined
    clearStack(group: string, destroy?: boolean): void
}

export interface IResManager { }

// 基础空类型，由业务层扩展
export interface IEventMsgKey { }
interface IMsgValueType { }
interface IResultType { }
// 将索引类型转换为任意类型的索引类型
export type ToAnyIndexKey<IndexKey, AnyType> = IndexKey extends keyof AnyType ? IndexKey : keyof AnyType;
// 监听方法再回调给广播
export type OnListenerResult<T = any> = (data?: T, callBack?: any) => void
// 监听方法
export type OnListener<T = any, K = any> = (value?: T, callBack?: OnListenerResult<K>, ...args: any[]) => void
// 监听参数结构
export type ListenerHandler<keyType extends keyof any = any, ValueType = any, ResultType = any> = {
    key: keyType
    listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
    context?: any,
    args?: any[],
}
// 事件管理器
export interface IEventManager<MsgKeyType extends IEventMsgKey = IEventMsgKey, ValueType = any, ResultType = any> {
    on<keyType extends keyof MsgKeyType>(
        keyOrHandler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[],
        listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        context?: any,
        args?: any[]
    ): void

    once<keyType extends keyof MsgKeyType>(
        keyOrHandler: keyType | ListenerHandler<keyType, ValueType, ResultType> | ListenerHandler<keyType, ValueType, ResultType>[],
        listener?: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        context?: any,
        args?: any[]
    ): void

    off<keyType extends keyof MsgKeyType>(
        key: keyType,
        listener: OnListener<ValueType[ToAnyIndexKey<keyType, ValueType>], ResultType[ToAnyIndexKey<keyType, ResultType>]>
    ): void

    offAll<keyType extends keyof MsgKeyType>(key?: keyType, context?: any): void

    dispatch<keyType extends keyof MsgKeyType>(
        key: keyType,
        data?: ValueType[ToAnyIndexKey<keyType, ValueType>],
        callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        persistence?: boolean
    ): void

    dispatchSticky<keyType extends keyof MsgKeyType>(
        key: keyType,
        data?: ValueType[ToAnyIndexKey<keyType, ValueType>],
        callback?: OnListenerResult<ResultType[ToAnyIndexKey<keyType, ResultType>]>,
        persistence?: boolean
    ): void

    removeStickyBroadcast(key: keyof MsgKeyType): void

    isRegistered(key: keyof MsgKeyType): boolean

    getPersistentValue<keyType extends keyof MsgKeyType>(key: keyType): ValueType[ToAnyIndexKey<keyType, ValueType>] | undefined

    dispose(): void
}