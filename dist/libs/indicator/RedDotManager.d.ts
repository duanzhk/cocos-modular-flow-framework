/**
 * 红点管理器,管理整个游戏的红点系统
 */
export declare class RedDotManager {
    private _root;
    private _nodeCache;
    constructor();
    initialize(): void;
    dispose(): void;
    /**
     * 获取或创建红点节点
     * @param path 节点路径，如 'main/bag/weapon'
     */
    private _getOrCreateNode;
    /**
     * 设置红点数量
     * @param path 节点路径
     * @param count 红点数量
     */
    setCount(path: string, count: number): void;
    /**
     * 增加红点数量
     * @param path 节点路径
     * @param delta 增量（可以为负数）
     */
    addCount(path: string, delta?: number): void;
    /**
     * 获取红点数量（包含子节点）
     * @param path 节点路径
     */
    getCount(path: string): number;
    /**
     * 是否有红点
     * @param path 节点路径
     */
    hasRedDot(path: string): boolean;
    /**
     * 清空红点
     * @param path 节点路径
     */
    clearRedDot(path: string): void;
    /**
     * 添加监听器
     * @param path 节点路径
     * @param listener 监听函数 (totalCount, selfCount) => void
     */
    on(path: string, listener: Function): void;
    /**
     * 移除监听器
     * @param path 节点路径
     * @param listener 监听函数
     */
    off(path: string, listener: Function): void;
    /**
     * 标准化路径
     */
    private _normalizePath;
}
