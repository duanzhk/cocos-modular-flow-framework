import { Node, Widget } from "cc";

/**
 * 为节点添加全屏Widget组件
 * @param node 要添加Widget的节点
 */
export function addWidget(node: Node): void {
    const widget = node.getComponent(Widget) || node.addComponent(Widget);
    widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;
    widget.left = widget.right = widget.top = widget.bottom = 0;
}
