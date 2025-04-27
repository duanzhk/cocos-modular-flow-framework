
    import { _decorator, Component, Node } from 'cc';
    import { BaseView } from "@libs";
    const { ccclass, property, disallowMultiple } = _decorator;
    @disallowMultiple()
    export abstract class BaseUITest extends BaseView {
        /** @internal */
        private static readonly __path__: string = "prefabs/common/UITest";
    }