import { _decorator, Component, Node, Sprite, director, Color, instantiate } from 'cc';
import { addWidget, ImageUtil } from '../utils';
import { ServiceLocator } from '../core';
import { ResLoader } from '.';
const { ccclass, property } = _decorator;

const DefaultLayer = 'default';

/**
 * 层级配置
 */
export interface LayerConfig {
    /** 层级名称 */
    name: string;
    /** 是否需要遮罩，默认true */
    needMask?: boolean;
}

/**
 * UI遮罩配置选项
 */
export interface UIMaskConfig {
    /** 遮罩颜色 */
    color?: Color;
}

/**
 * 等待视图配置
 */
export interface UIWaitConfig {
    /** 是否全局启用等待视图 */
    enabled?: boolean;
    /** 等待视图预制体路径 */
    prefabPath?: string;
    /** 等待视图显示延迟（毫秒） */
    delay?: number;
    /** 最小显示时间（毫秒） */
    minShowTime?: number;
    /** 自定义创建函数（高级用法） */
    createCustomLoading?: () => Node | Promise<Node>;
}


@ccclass('UIRoot')
export class UIRoot extends Component {
    private _layers: Map<string, Node> = new Map();

    private _maskNode: Node | undefined;
    private _loadingNode: Node | null = null;

    private _layerConfigs: Map<string, LayerConfig> = new Map();
    private _maskOptions: UIMaskConfig = {};
    private _waitConfig: UIWaitConfig = {
        enabled: true,
        delay: 200,
        minShowTime: 500
    };


    onLoad(): void {
        this._maskNode = this.getUIMask();
        this.createLayers([{ name: DefaultLayer, needMask: true }]);
    }

    /**
     * 创建层级
     * @param layers 层级配置数组
     */
    public createLayers(layers: (string | LayerConfig)[]) {
        for (const layer of layers) {
            const config: LayerConfig = typeof layer === 'string'
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
    public getUIMask(): Node {
        if (!this._maskNode) {
            const canvas = director.getScene()!.getChildByPath('Canvas')!;
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
    public addUINode(node: Node, layer: string = DefaultLayer) {
        const layerNode = this.getLayer(layer);
        if (!layerNode) {
            console.warn(`Layer ${layer} not found`);
            return
        } else {
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
    public removeUINode(node: Node) {
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
    public getTopUIInLayer(layer: string): Node | undefined {
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
    public getGlobalTopUI(): { node: Node; layer: string } | undefined {
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
    public getUINodesInLayer(layer: string): Node[] {
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
    public getAllActiveUINodes(): Node[] {
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
    public adjustMaskLayer() {
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
        const layerNode = this.getLayer(topUIInfo.layer)!;
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
    public hasLayer(layer: string): boolean {
        return this._layers.has(layer);
    }

    /**
     * 获取层级节点
     * @param layer 层级名称
     * @returns 层级节点
     */
    public getLayer(layer: string): Node | undefined {
        return this._layers.get(layer);
    }

    /**
    * 设置遮罩配置
    */
    public setMaskConfig(options: UIMaskConfig): void {
        this._maskOptions = { ...this._maskOptions, ...options };
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
    public setWaitConfig(config: UIWaitConfig): void {
        this._waitConfig = { ...this._waitConfig, ...config };
    }

    /**
    * 显示等待视图
    */
    public async showLoading(layerName: string = DefaultLayer): Promise<void> {
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
                this._loadingNode = await this._waitConfig.createCustomLoading();
            } else if (this._waitConfig.prefabPath) {
                try {
                    // 从 prefab 创建等待视图
                    const ResMgr = ServiceLocator.getService<ResLoader>('ResLoader');
                    const prefab = await ResMgr.loadPrefab(this._waitConfig.prefabPath);
                    this._loadingNode = instantiate(prefab);
                } catch (error) {
                    throw error;
                }
            } else {
                // 没有配置等待视图
                return Promise.resolve();
            }
        }

        // 激活并添加到场景，调整到最顶层
        this.node.addChild(this._loadingNode!);
        this._setNodeLayer(this._loadingNode!, this.node.layer);
        this._loadingNode!.active = true;
    }

    /**
     * 隐藏等待视图
     */
    public hideLoading(): void {
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
    private _setNodeLayer(node: Node, layer: number) {
        node.layer = layer;
        node.children.forEach(child => {
            this._setNodeLayer(child, layer);
        });
    }
}