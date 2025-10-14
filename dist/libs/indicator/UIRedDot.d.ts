import { Component, Node, Label } from 'cc';
/**
 * 红点显示组件
 * 挂载到需要显示红点的 UI 节点上
 */
export declare class UIRedDot extends Component {
    redDotNode: Node;
    showCount: boolean;
    countLabel: Label | null;
    maxCount: number;
    redDotPath: string;
    private _listener;
    onLoad(): void;
    start(): void;
    onDestroy(): void;
    /**
     * 绑定红点路径
     */
    bindPath(path: string): void;
    /**
     * 解绑
     */
    unbind(): void;
    /**
     * 更新显示
     */
    private _updateDisplay;
}
