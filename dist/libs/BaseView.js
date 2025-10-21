import { __awaiter } from '../_virtual/_tslib.js';
import { _decorator, Component, UIOpacity, tween, Vec3 } from 'cc';

const { ccclass, property } = _decorator;
class BaseView extends Component {
    constructor() {
        super(...arguments);
        /** @internal */
        this.__isIView__ = true;
        this._eventHandlers = [];
        this._loaderHandlers = [];
    }
    get event() {
        if (!this._eventProxy) {
            this._eventProxy = new Proxy(mf.event, {
                get: (target, prop) => {
                    if (prop === 'on' || prop === 'once') {
                        return (keyOrHandler, listener, context, args) => {
                            const handlers = Array.isArray(keyOrHandler) ? keyOrHandler : [keyOrHandler];
                            handlers.forEach(handler => {
                                if (typeof handler === 'object') {
                                    this._eventHandlers.push({ key: handler.key, listener: handler.listener });
                                }
                                else {
                                    this._eventHandlers.push({ key: keyOrHandler, listener: listener });
                                }
                            });
                            return Reflect.get(target, prop).apply(target, [keyOrHandler, listener, context, args]);
                        };
                    }
                    return Reflect.get(target, prop);
                }
            });
        }
        return this._eventProxy;
    }
    get res() {
        if (!this._loaderProxy) {
            this._loaderProxy = new Proxy(mf.res, {
                get: (target, prop) => {
                    //劫持所有load相关方法
                    if (prop.startsWith('load')) {
                        return (path, type, nameOrUrl) => {
                            return Reflect.get(target, prop).apply(target, [path, type, nameOrUrl]).then((asset) => {
                                this._loaderHandlers.push({ path, asset });
                                return asset;
                            });
                        };
                    }
                    return Reflect.get(target, prop);
                }
            });
        }
        return this._loaderProxy;
    }
    onExit() {
        // 自动清理所有事件监听
        this._eventHandlers.forEach(({ key, listener }) => {
            //@ts-ignore
            mf.event.off(key, listener);
        });
        this._eventHandlers = [];
    }
    onDestroy() {
        // 自动清理加载的资源
        this._loaderHandlers.forEach(({ path, asset }) => {
            mf.res.release(asset);
        });
        this._loaderHandlers = [];
    }
    /**
     * 获取 Model 实例
     * @param modelClass Model 类构造函数
     * @returns Model 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const userModel = this.getModel(UserModel);
     * ```
     */
    getModel(modelClass) {
        return mf.core.getModel(modelClass);
    }
    /**
     * 获取 Manager 实例
     * @param managerClass Manager 类构造函数
     * @returns Manager 实例（类型由泛型参数推断）
     * @example
     * ```typescript
     * const gameManager = this.getManager(GameManager);
     * ```
     */
    getManager(managerClass) {
        return mf.core.getManager(managerClass);
    }
    /**
     * 进入动画（可被子类覆盖以实现自定义动画）
     * 默认实现：缩放+淡入效果
     * @returns 返回 Promise 以支持异步动画
     * @example
     * ```typescript
     * async onEnterAnimation(): Promise<void> {
     *     // 自定义动画实现
     *     return new Promise<void>((resolve) => {
     *         tween(this.node)
     *             .to(0.5, { scale: new Vec3(1, 1, 1) })
     *             .call(() => resolve())
     *             .start();
     *     });
     * }
     * ```
     */
    onEnterAnimation() {
        return __awaiter(this, void 0, void 0, function* () {
            const node = this.node;
            node.setScale(0.8, 0.8, 1);
            let uiOpacity = node.getComponent(UIOpacity);
            if (uiOpacity) {
                uiOpacity.opacity = 0;
            }
            return new Promise((resolve) => {
                const tweenNode = tween(node).to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' });
                if (uiOpacity) {
                    tween(uiOpacity)
                        .to(0.3, { opacity: 255 })
                        .start();
                }
                tweenNode
                    .call(() => resolve())
                    .start();
            });
        });
    }
    /**
     * 退出动画（可被子类覆盖以实现自定义动画）
     * 默认实现：缩放+淡出效果
     * @returns 返回 Promise 以支持异步动画
     * @example
     * ```typescript
     * async onExitAnimation(): Promise<void> {
     *     // 自定义动画实现
     *     return new Promise<void>((resolve) => {
     *         tween(this.node)
     *             .to(0.3, { scale: new Vec3(0, 0, 1) })
     *             .call(() => resolve())
     *             .start();
     *     });
     * }
     * ```
     */
    onExitAnimation() {
        return __awaiter(this, void 0, void 0, function* () {
            const node = this.node;
            const uiOpacity = node.getComponent(UIOpacity);
            return new Promise((resolve) => {
                const tweenNode = tween(node).to(0.2, { scale: new Vec3(0.8, 0.8, 1) }, { easing: 'backIn' });
                if (uiOpacity) {
                    tween(uiOpacity)
                        .to(0.2, { opacity: 0 })
                        .start();
                }
                tweenNode
                    .call(() => resolve())
                    .start();
            });
        });
    }
}

export { BaseView };
