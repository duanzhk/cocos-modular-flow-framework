//ServiceLocator：管理跨领域基础服务
export class ServiceLocator {
    private static services = new Map<string, { factory: Function; instance?: any }>();

    static regService<T>(key: string, provider: T): void {
        if (typeof provider === 'function') {
            // 注册工厂函数（延迟执行）
            this.services.set(key, { factory: provider });
        } else {
            // 直接注册实例
            this.services.set(key, { factory: () => provider, instance: provider });
        }
    }

    static getService<T>(key: string): T {
        const entry = this.services.get(key);
        if (!entry) throw new Error(`Service ${key} not registered!`);

        // 单例模式：若已有实例，直接返回
        if (entry.instance) return entry.instance as T;

        // 执行工厂函数，创建实例并缓存
        const instance = entry.factory();
        entry.instance = instance; // 缓存实例（单例）
        return instance as T;
    }

    static remove(key: string): void {
        this.services.delete(key);
    }

    static clear(): void {
        this.services.clear();
    }
}