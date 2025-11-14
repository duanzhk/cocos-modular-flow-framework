import { RedDotNode } from "./RedDotNode";

/**
 * 红点管理器,管理整个游戏的红点系统
 */
export class RedDotManager {
    private _root: RedDotNode = null!;
    private _nodeCache: Map<string, RedDotNode> = new Map();

    constructor() {
        this.initialize();
    }

    initialize(): void {
        this._root = new RedDotNode('root');
        this._nodeCache.set('root', this._root);
        console.log('RedDotManager 初始化完成');
    }

    dispose(): void {
        this._root.destroy();
        this._nodeCache.clear();
    }

    /**
     * 获取或创建红点节点
     * @param path 节点路径，如 'main/bag/weapon'
     */
    private _getOrCreateNode(path: string): RedDotNode {
        // 标准化路径
        path = this._normalizePath(path);

        // 检查缓存
        if (this._nodeCache.has(path)) {
            return this._nodeCache.get(path)!;
        }

        // 分割路径
        const parts = path.split('/');
        let currentNode = this._root;
        let currentPath = 'root';

        // 逐级创建节点
        for (const part of parts) {
            if (!part) continue;

            currentPath = currentPath === 'root' ? part : `${currentPath}/${part}`;

            let childNode = currentNode.getChild(part);
            if (!childNode) {
                childNode = new RedDotNode(currentPath);
                currentNode.addChild(childNode);
                this._nodeCache.set(currentPath, childNode);
            }

            currentNode = childNode;
        }

        return currentNode;
    }

    /**
     * 设置红点数量
     * @param path 节点路径
     * @param count 红点数量
     */
    setCount(path: string, count: number): void {
        const node = this._getOrCreateNode(path);
        node.setCount(count);
    }

    /**
     * 增加红点数量
     * @param path 节点路径
     * @param delta 增量（可以为负数）
     */
    addCount(path: string, delta: number = 1): void {
        const node = this._getOrCreateNode(path);
        node.addCount(delta);
    }

    /**
     * 获取红点数量（包含子节点）
     * @param path 节点路径
     */
    getCount(path: string): number {
        const node = this._nodeCache.get(this._normalizePath(path));
        return node ? node.getTotalCount() : 0;
    }

    /**
     * 是否有红点
     * @param path 节点路径
     */
    hasRedDot(path: string): boolean {
        return this.getCount(path) > 0;
    }

    /**
     * 清空红点
     * @param path 节点路径
     */
    clearRedDot(path: string): void {
        const node = this._nodeCache.get(this._normalizePath(path));
        if (node) {
            node.clear();
        }
    }

    /**
     * 添加监听器
     * @param path 节点路径
     * @param listener 监听函数 (totalCount, selfCount) => void
     */
    on(path: string, listener: Function): void {
        const node = this._getOrCreateNode(path);
        node.addListener(listener);

        // 立即触发一次，让监听者知道当前状态
        listener(node.getTotalCount(), node.getCount());
    }

    /**
     * 移除监听器
     * @param path 节点路径
     * @param listener 监听函数
     */
    off(path: string, listener: Function): void {
        const node = this._nodeCache.get(this._normalizePath(path));
        if (node) {
            node.removeListener(listener);
        }
    }

    /**
     * 标准化路径
     */
    private _normalizePath(path: string): string {
        // 移除开头和结尾的斜杠
        return path.replace(/^\/+|\/+$/g, '');
    }
}