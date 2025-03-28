import { starmaker } from '../core/Core'; // 引入命名空间

export class EventManager implements starmaker.core.IEventManager {
    private handlers = new Map<string, ((data?: any) => void)[]>();

    dispatch(eventType: string, data?: any): void {
        const listeners = this.handlers.get(eventType) || [];
        listeners.forEach(handler => handler(data));
    }

    on(eventType: string, handler: (data?: any) => void): void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType)!.push(handler);
    }

    off(eventType: string): void {
        this.handlers.delete(eventType);
    }

    clear(): void {
        this.handlers.clear();
    }

    dispose(): void {
        this.handlers.clear();
    }
}
