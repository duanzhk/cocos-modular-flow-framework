
import { _decorator,Component,Node,Sprite } from 'cc';
import { BaseView } from "@libs";
const { ccclass, property, disallowMultiple } = _decorator;
@disallowMultiple()
export abstract class BaseUITest extends BaseView {
    /** @internal */
    private static readonly __path__: string = "prefabs/common/UITest";
    @property({ type: Node }) MyFlag:Node = null!;
	@property({ type: Sprite }) Line:Sprite = null!;
}