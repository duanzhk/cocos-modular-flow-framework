export declare class ServiceLocator {
    private static services;
    static regService<T>(key: string, provider: T): void;
    static getService<T>(key: string): T;
    static remove(key: string): void;
    static clear(): void;
}
