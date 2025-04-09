
    import { _decorator, Component, Node } from 'cc';
    import { BaseView } from "../framework/libs/BaseView";
    const { ccclass, property, disallowMultiple } = _decorator;
    @disallowMultiple()
    export abstract class BaseUITest extends BaseView {
        /** @internal */
        private static readonly __path__: string = "prefabs/common/UITest";

        abstract onEnter(args?: any): void
        abstract onExit(): void
        abstract onPause(): void
        abstract onResume(): void
    }