import { __decorate, __metadata } from '../../_virtual/_tslib.js';
import { _decorator, Node, Label, Component } from 'cc';

const { ccclass, property } = _decorator;
/**
 * 红点显示组件
 * 挂载到需要显示红点的 UI 节点上
 */
let UIRedDot = class UIRedDot extends Component {
    constructor() {
        super(...arguments);
        this.redDotNode = null; // 红点节点（圆点或图标）
        this.showCount = true;
        this.countLabel = null; // 数字标签（可选）
        this.maxCount = 99;
        this.redDotPath = '';
        this._listener = null;
    }
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
    bindPath(path) {
        this.unbind();
        this.redDotPath = path;
        // 创建监听器
        this._listener = (totalCount, selfCount) => {
            this._updateDisplay(totalCount);
        };
        // 添加监听
        mf.reddot.on(path, this._listener);
    }
    /**
     * 解绑
     */
    unbind() {
        if (this._listener && this.redDotPath) {
            mf.reddot.off(this.redDotPath, this._listener);
            this._listener = null;
        }
    }
    /**
     * 更新显示
     */
    _updateDisplay(count) {
        if (!this.redDotNode)
            return;
        // 显示/隐藏红点
        this.redDotNode.active = count > 0;
        // 更新数字
        if (this.countLabel && this.showCount) {
            if (count > this.maxCount) {
                this.countLabel.string = `${this.maxCount}+`;
            }
            else {
                this.countLabel.string = count.toString();
            }
            this.countLabel.node.active = count > 0;
        }
    }
};
__decorate([
    property(Node),
    __metadata("design:type", Node)
], UIRedDot.prototype, "redDotNode", void 0);
__decorate([
    property({ tooltip: '是否显示数字' }),
    __metadata("design:type", Boolean)
], UIRedDot.prototype, "showCount", void 0);
__decorate([
    property(Label),
    __metadata("design:type", Object)
], UIRedDot.prototype, "countLabel", void 0);
__decorate([
    property({ tooltip: '最大显示数字，超过显示 99+' }),
    __metadata("design:type", Number)
], UIRedDot.prototype, "maxCount", void 0);
__decorate([
    property({ tooltip: '红点路径，如 main/bag/weapon' }),
    __metadata("design:type", String)
], UIRedDot.prototype, "redDotPath", void 0);
UIRedDot = __decorate([
    ccclass('UIRedDot')
], UIRedDot);

export { UIRedDot };
