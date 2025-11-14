// ============================================================================
// 全局类型声明
// ============================================================================

/**
 * 全局类型声明 - 由业务层通过 .d.ts 扩展
 * 用于泛型约束的类型推断
 */
declare global {
    interface ModelRegistry {
        // 由业务层扩展
    }

    interface ManagerRegistry {
        // 由业务层扩展
    }

    interface UIRegistry {
        // 由业务层扩展
    }
}


// ============================================================================
// 核心接口定义
// ============================================================================

/**
 * 核心接口 - 管理 Model 和 Manager 的生命周期
 * 
 * 类型推断由业务层的全局类型声明提供
 */
export interface ICore {
    /** 
     * 获取 Model 实例
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const userModel = core.getModel(UserModel);
     * ```
     */
    getModel<T extends keyof ModelRegistry>(modelClass: T): InstanceType<ModelRegistry[T]>;

    /** 
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const gameManager = core.getManager(GameManager);
     * ```
     */
    getManager<T extends keyof ManagerRegistry>(managerClass: T): InstanceType<ManagerRegistry[T]>;
}

/**
 * Model 基接口 - 数据模型
 */
export interface IModel {
    /** 初始化 */
    initialize(): void;
}

/**
 * Manager 基接口 - 业务逻辑管理器
 */
export interface IManager {
    /** 初始化 */
    initialize(): void;
    /** 销毁 */
    dispose(): void;
}

/**
 * UI打开选项
 */
export interface UIOpenConfig {
    /** 是否显示等待视图 */
    showLoading?: boolean;
    /** 是否可点击遮罩关闭 */
    clickToCloseMask?: boolean;
    /** 层级名称，由业务层定义，默认为'default' */
    layer?: string;
    /** 自定义参数 */
    args?: any;
    /** 退出回调 */
    onExitCallback?: (view: any) => void;
}

/**
 * View 基接口 - 视图生命周期
 */
export interface IView {
    /** 进入视图 */
    onEnter(args?: UIOpenConfig): void;
    /** 退出视图 */
    onExit(): void;
    /** 暂停视图（被其他视图覆盖） */
    onPause(): void;
    /** 恢复视图（从暂停状态恢复） */
    onResume(): void;
    /** 进入动画（可选） */
    onEnterAnimation?(): Promise<void>;
    /** 退出动画（可选） */
    onExitAnimation?(): Promise<void>;
}