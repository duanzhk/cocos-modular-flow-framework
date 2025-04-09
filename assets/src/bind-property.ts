import { Component, Enum, EventHandler } from "cc";
import { _decorator } from "cc";
const { ccclass, property, executeInEditMode, menu } = _decorator;

@ccclass('UIBindProperty')
@executeInEditMode(true)
export class BindProperty extends Component {

    @property(EventHandler)
    comps: EventHandler = new EventHandler();

    protected onEnable(): void {
        this.comps.target = this.node
    }
}