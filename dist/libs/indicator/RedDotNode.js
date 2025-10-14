/**
 * 红点节点
 * 采用树形结构，支持父子关系和自动向上传递
 */
class RedDotNode {
    constructor(path) {
        this.count = 0; // 红点数量（自身）
        this.totalCount = 0; // 红点数量（包含子节点）
        this.parent = null; // 父节点
        this.children = new Map(); // 子节点
        this.listeners = new Set(); // 监听器
        this.path = path;
    }
    /**
     * 获取路径
     */
    getPath() {
        return this.path;
    }
    /**
     * 设置红点数量（只影响当前节点）
     */
    setCount(count) {
        if (this.count === count)
            return;
        this.count;
        this.count = Math.max(0, count);
        // 重新计算总数
        this.updateTotalCount();
    }
    /**
     * 增加红点数量
     */
    addCount(delta) {
        this.setCount(this.count + delta);
    }
    /**
     * 获取红点数量（只包含自身）
     */
    getCount() {
        return this.count;
    }
    /**
     * 获取总红点数量（包含所有子节点）
     */
    getTotalCount() {
        return this.totalCount;
    }
    /**
     * 是否有红点（包含子节点）
     */
    hasRedDot() {
        return this.totalCount > 0;
    }
    /**
     * 添加子节点
     */
    addChild(child) {
        const childName = child.getPath().split('/').pop();
        this.children.set(childName, child);
        child.parent = this;
        // 子节点变化时，更新自己的总数
        this.updateTotalCount();
    }
    /**
     * 获取子节点
     */
    getChild(name) {
        return this.children.get(name);
    }
    /**
     * 添加监听器
     */
    addListener(listener) {
        this.listeners.add(listener);
    }
    /**
     * 移除监听器
     */
    removeListener(listener) {
        this.listeners.delete(listener);
    }
    /**
     * 更新总数（包含所有子节点）
     */
    updateTotalCount() {
        const oldTotalCount = this.totalCount;
        // 计算新的总数：自身数量 + 所有子节点的总数
        let newTotalCount = this.count;
        this.children.forEach(child => {
            newTotalCount += child.getTotalCount();
        });
        this.totalCount = newTotalCount;
        // 如果总数发生变化
        if (oldTotalCount !== newTotalCount) {
            // 通知监听器
            this.notifyListeners();
            // 向上传递给父节点
            if (this.parent) {
                this.parent.updateTotalCount();
            }
        }
    }
    /**
     * 通知所有监听器
     */
    notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.totalCount, this.count);
            }
            catch (error) {
                console.error(`红点监听器执行错误 [${this.path}]:`, error);
            }
        });
    }
    /**
     * 清空红点（包含所有子节点）
     */
    clear() {
        this.setCount(0);
        this.children.forEach(child => child.clear());
    }
    /**
     * 销毁节点
     */
    destroy() {
        this.listeners.clear();
        this.children.forEach(child => child.destroy());
        this.children.clear();
        this.parent = null;
    }
}

export { RedDotNode };
