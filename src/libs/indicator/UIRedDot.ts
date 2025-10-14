import { _decorator, Component, Node, Label } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 红点显示组件
 * 挂载到需要显示红点的 UI 节点上
 */
@ccclass('UIRedDot')
export class UIRedDot extends Component {
    @property(Node)
    redDotNode: Node = null!; // 红点节点（圆点或图标）

    @property({ tooltip: '是否显示数字' })
    showCount: boolean = true;

    @property(Label)
    countLabel: Label | null = null; // 数字标签（可选）

    @property({ tooltip: '最大显示数字，超过显示 99+' })
    maxCount: number = 99;

    @property({ tooltip: '红点路径，如 main/bag/weapon' })
    redDotPath: string = '';

    private _listener: Function | null = null;

    onLoad() {
        if (!this.redDotNode) {
            console.error('RedDotComponent: redDotNode 未设置');
            return;
        }

        // 初始时隐藏红点
        this.redDotNode.active = false;
    }

    start() {
        if (this.redDotPath) {
            this.bindPath(this.redDotPath);
        }
    }

    onDestroy() {
        this.unbind();
    }

    /**
     * 绑定红点路径
     */
    bindPath(path: string): void {
        this.unbind();
        
        this.redDotPath = path;
        
        // 创建监听器
        this._listener = (totalCount: number, selfCount: number) => {
            this._updateDisplay(totalCount);
        };
        
        // 添加监听
        mf.reddot.on(path, this._listener);
    }

    /**
     * 解绑
     */
    unbind(): void {
        if (this._listener && this.redDotPath) {
            mf.reddot.off(this.redDotPath, this._listener);
            this._listener = null;
        }
    }

    /**
     * 更新显示
     */
    private _updateDisplay(count: number): void {
        if (!this.redDotNode) return;

        // 显示/隐藏红点
        this.redDotNode.active = count > 0;

        // 更新数字
        if (this.countLabel && this.showCount) {
            if (count > this.maxCount) {
                this.countLabel.string = `${this.maxCount}+`;
            } else {
                this.countLabel.string = count.toString();
            }
            this.countLabel.node.active = count > 0;
        }
    }
}