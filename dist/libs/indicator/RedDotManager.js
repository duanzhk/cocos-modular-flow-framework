import { RedDotNode } from './RedDotNode.js';

/**
 * 红点管理器,管理整个游戏的红点系统
 */
class RedDotManager {
    constructor() {
        this._root = null;
        this._nodeCache = new Map();
    }
    initialize() {
        this._root = new RedDotNode('root');
        this._nodeCache.set('root', this._root);
        console.log('RedDotManager 初始化完成');
    }
    dispose() {
        this._root.destroy();
        this._nodeCache.clear();
    }
    /**
     * 获取或创建红点节点
     * @param path 节点路径，如 'main/bag/weapon'
     */
    _getOrCreateNode(path) {
        // 标准化路径
        path = this._normalizePath(path);
        // 检查缓存
        if (this._nodeCache.has(path)) {
            return this._nodeCache.get(path);
        }
        // 分割路径
        const parts = path.split('/');
        let currentNode = this._root;
        let currentPath = 'root';
        // 逐级创建节点
        for (const part of parts) {
            if (!part)
                continue;
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
    setCount(path, count) {
        const node = this._getOrCreateNode(path);
        node.setCount(count);
    }
    /**
     * 增加红点数量
     * @param path 节点路径
     * @param delta 增量（可以为负数）
     */
    addCount(path, delta = 1) {
        const node = this._getOrCreateNode(path);
        node.addCount(delta);
    }
    /**
     * 获取红点数量（包含子节点）
     * @param path 节点路径
     */
    getCount(path) {
        const node = this._nodeCache.get(this._normalizePath(path));
        return node ? node.getTotalCount() : 0;
    }
    /**
     * 是否有红点
     * @param path 节点路径
     */
    hasRedDot(path) {
        return this.getCount(path) > 0;
    }
    /**
     * 清空红点
     * @param path 节点路径
     */
    clearRedDot(path) {
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
    on(path, listener) {
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
    off(path, listener) {
        const node = this._nodeCache.get(this._normalizePath(path));
        if (node) {
            node.removeListener(listener);
        }
    }
    /**
     * 标准化路径
     */
    _normalizePath(path) {
        // 移除开头和结尾的斜杠
        return path.replace(/^\/+|\/+$/g, '');
    }
}

export { RedDotManager };
