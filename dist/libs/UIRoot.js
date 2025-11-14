import { __decorate, __awaiter } from '../_virtual/_tslib.js';
import { _decorator, Component, Node, director, Sprite, instantiate } from 'cc';
import '../utils/ArrayExt.js';
import { ImageUtil } from '../utils/ImageUtil.js';
import '../utils/MathUtil.js';
import { addWidget } from '../utils/UIUtil.js';
import { ServiceLocator } from '../core/ServiceLocator.js';

const { ccclass, property } = _decorator;
const DefaultLayer = 'default';
let UIRoot = class UIRoot extends Component {
    constructor() {
        super(...arguments);
        this._layers = new Map();
        this._loadingNode = null;
        this._layerConfigs = new Map();
        this._maskOptions = {};
        this._waitConfig = {
            enabled: true,
            delay: 200,
            minShowTime: 500
        };
    }
    onLoad() {
        this._maskNode = this.getUIMask();
        this.createLayers([{ name: DefaultLayer, needMask: true }]);
    }
    /**
     * 创建层级
     * @param layers 层级配置数组
     */
    createLayers(layers) {
        for (const layer of layers) {
            const config = typeof layer === 'string'
                ? { name: layer, needMask: true }
                : layer;
            if (this.hasLayer(config.name)) {
                continue;
            }
            const node = new Node(config.name);
            node.layer = this.node.layer;
            this.node.addChild(node);
            addWidget(node);
            this._layers.set(config.name, node);
            this._layerConfigs.set(config.name, config);
        }
    }
    /**
     * 设置遮罩节点
     * @param maskNode 遮罩节点
     */
    getUIMask() {
        if (!this._maskNode) {
            const canvas = director.getScene().getChildByPath('Canvas');
            let maskNode = canvas.getChildByName('__UIMask__');
            if (!maskNode) {
                maskNode = new Node('__UIMask__');
                maskNode.setPosition(0, 0);
                maskNode.addComponent(Sprite).spriteFrame = ImageUtil.createSolidColorSpriteFrame();
                addWidget(maskNode);
                maskNode.active = false;
                maskNode.setParent(this.node);
            }
            this._maskNode = maskNode;
        }
        return this._maskNode;
    }
    /**
     * 添加UI节点到指定层
     * @param node UI节点
     * @param layer 层级名称，默认为default
     */
    addUINode(node, layer = DefaultLayer) {
        const layerNode = this.getLayer(layer);
        if (!layerNode) {
            console.warn(`Layer ${layer} not found`);
            return;
        }
        else {
            layerNode.addChild(node);
        }
        // 设置节点的layer属性
        this._setNodeLayer(node, this.node.layer);
        // 添加UI后调整遮罩位置
        this.adjustMaskLayer();
    }
    /**
     * 从层级中移除UI节点
     * @param node UI节点
     */
    removeUINode(node) {
        if (node.parent && this.hasLayer(node.parent.name)) {
            node.removeFromParent();
        }
        // 移除UI后调整遮罩位置
        this.adjustMaskLayer();
    }
    /**
     * 获取指定层的最顶层UI节点
     * @param layer 层级名称
     * @returns 最顶层的UI节点，如果没有则返回undefined
     */
    getTopUIInLayer(layer) {
        const nodes = this.getUINodesInLayer(layer);
        if (nodes.length === 0) {
            return undefined;
        }
        return nodes[nodes.length - 1];
    }
    /**
     * 获取全局最顶层的UI节点（所有层中最顶层的）
     * @returns 最顶层的UI节点及其所属层级
     */
    getGlobalTopUI() {
        const mask = this.getUIMask();
        // 按照层级在UIRoot中的顺序（也就是siblingIndex）从后往前查找
        for (let i = this.node.children.length - 1; i >= 0; i--) {
            const layerNode = this.node.children[i];
            // 跳过遮罩节点
            if (mask && layerNode === mask) {
                continue;
            }
            const nodes = this.getUINodesInLayer(layerNode.name);
            if (nodes.length > 0) {
                const topViewNode = nodes[nodes.length - 1];
                return { node: topViewNode, layer: layerNode.name };
            }
        }
        return undefined;
    }
    /**
     * 获取指定层中的所有UI节点
     * @param layer 层级名称
     * @returns UI节点数组
     */
    getUINodesInLayer(layer) {
        const layerNode = this.getLayer(layer);
        if (!layerNode) {
            return [];
        }
        // 过滤掉遮罩节点，因为遮罩现在可能在层级内部
        return layerNode.children.filter(childNode => childNode !== this.getUIMask());
    }
    /**
     * 获取所有活跃的UI节点（所有层）
     * @returns 所有活跃的UI节点数组
     */
    getAllActiveUINodes() {
        const mask = this.getUIMask();
        // 使用 flatMap 优化，消除循环嵌套
        return Array.from(this._layers.values())
            .filter(layerNode => layerNode !== mask)
            .flatMap(layerNode => layerNode.children)
            .filter(childNode => childNode !== mask);
    }
    /**
     * 调整遮罩位置
     * 将遮罩移动到全局最顶层UI的下方，并根据层级配置决定是否显示
     */
    adjustMaskLayer() {
        const mask = this.getUIMask();
        if (!mask) {
            return;
        }
        const topUIInfo = this.getGlobalTopUI();
        // 没有任何UI时隐藏遮罩
        if (!topUIInfo) {
            mask.active = false;
            return;
        }
        // 检查该层是否需要遮罩
        const layerConfig = this._layerConfigs.get(topUIInfo.layer);
        if (layerConfig && layerConfig.needMask === false) {
            mask.active = false;
            return;
        }
        // 显示遮罩并调整到最顶层UI的下方
        const layerNode = this.getLayer(topUIInfo.layer);
        // 将遮罩移动到UI所在的层级中，这时遮罩在该层级的最下方(遮挡所有UI)
        mask.setParent(layerNode);
        mask.active = true;
        // 更换目标UI和遮罩的层级关系，遮罩在目标UI的上方(不遮挡目标UI)
        mask.setSiblingIndex(topUIInfo.node.getSiblingIndex());
    }
    /**
     * 检查指定层是否存在
     * @param layer 层级名称
     * @returns 是否存在
     */
    hasLayer(layer) {
        return this._layers.has(layer);
    }
    /**
     * 获取层级节点
     * @param layer 层级名称
     * @returns 层级节点
     */
    getLayer(layer) {
        return this._layers.get(layer);
    }
    /**
    * 设置遮罩配置
    */
    setMaskConfig(options) {
        this._maskOptions = Object.assign(Object.assign({}, this._maskOptions), options);
        if (options.color) {
            const sprite = this.getUIMask().getComponent(Sprite);
            if (sprite) {
                sprite.color = options.color;
            }
        }
    }
    /**
     * 设置等待视图配置
     */
    setWaitConfig(config) {
        this._waitConfig = Object.assign(Object.assign({}, this._waitConfig), config);
    }
    /**
    * 显示等待视图
    */
    showLoading(layerName = DefaultLayer) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._waitConfig.enabled) {
                return Promise.resolve();
            }
            // 如果已经显示了等待视图，直接返回
            if (this._loadingNode && this._loadingNode.activeInHierarchy) {
                return Promise.resolve();
            }
            // 首次加载或创建等待视图
            if (!this._loadingNode) {
                if (this._waitConfig.createCustomLoading) {
                    // 使用自定义创建函数
                    this._loadingNode = yield this._waitConfig.createCustomLoading();
                }
                else if (this._waitConfig.prefabPath) {
                    try {
                        // 从 prefab 创建等待视图
                        const ResMgr = ServiceLocator.getService('ResLoader');
                        const prefab = yield ResMgr.loadPrefab(this._waitConfig.prefabPath);
                        this._loadingNode = instantiate(prefab);
                    }
                    catch (error) {
                        throw error;
                    }
                }
                else {
                    // 没有配置等待视图
                    return Promise.resolve();
                }
            }
            // 激活并添加到场景，调整到最顶层
            this.node.addChild(this._loadingNode);
            this._setNodeLayer(this._loadingNode, this.node.layer);
            this._loadingNode.active = true;
        });
    }
    /**
     * 隐藏等待视图
     */
    hideLoading() {
        if (this._loadingNode && this._loadingNode.activeInHierarchy) {
            this._loadingNode.active = false;
            if (this._loadingNode.parent) {
                this._loadingNode.removeFromParent();
            }
        }
    }
    /**
     * 递归设置节点及其子节点的layer属性
     * @param node 节点
     * @param layer layer值
     */
    _setNodeLayer(node, layer) {
        node.layer = layer;
        node.children.forEach(child => {
            this._setNodeLayer(child, layer);
        });
    }
};
UIRoot = __decorate([
    ccclass('UIRoot')
], UIRoot);

export { UIRoot };
