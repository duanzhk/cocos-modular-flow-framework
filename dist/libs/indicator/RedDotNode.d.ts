/**
 * 红点节点
 * 采用树形结构，支持父子关系和自动向上传递
 */
export declare class RedDotNode {
    private path;
    private count;
    private totalCount;
    private parent;
    private children;
    private listeners;
    constructor(path: string);
    /**
     * 获取路径
     */
    getPath(): string;
    /**
     * 设置红点数量（只影响当前节点）
     */
    setCount(count: number): void;
    /**
     * 增加红点数量
     */
    addCount(delta: number): void;
    /**
     * 获取红点数量（只包含自身）
     */
    getCount(): number;
    /**
     * 获取总红点数量（包含所有子节点）
     */
    getTotalCount(): number;
    /**
     * 是否有红点（包含子节点）
     */
    hasRedDot(): boolean;
    /**
     * 添加子节点
     */
    addChild(child: RedDotNode): void;
    /**
     * 获取子节点
     */
    getChild(name: string): RedDotNode | undefined;
    /**
     * 添加监听器
     */
    addListener(listener: Function): void;
    /**
     * 移除监听器
     */
    removeListener(listener: Function): void;
    /**
     * 更新总数（包含所有子节点）
     */
    private updateTotalCount;
    /**
     * 通知所有监听器
     */
    private notifyListeners;
    /**
     * 清空红点（包含所有子节点）
     */
    clear(): void;
    /**
     * 销毁节点
     */
    destroy(): void;
}
