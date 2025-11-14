import { Component, Node, Color } from 'cc';
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
export declare class UIRoot extends Component {
    private _layers;
    private _maskNode;
    private _loadingNode;
    private _layerConfigs;
    private _maskOptions;
    private _waitConfig;
    onLoad(): void;
    /**
     * 创建层级
     * @param layers 层级配置数组
     */
    createLayers(layers: (string | LayerConfig)[]): void;
    /**
     * 设置遮罩节点
     * @param maskNode 遮罩节点
     */
    getUIMask(): Node;
    /**
     * 添加UI节点到指定层
     * @param node UI节点
     * @param layer 层级名称，默认为default
     */
    addUINode(node: Node, layer?: string): void;
    /**
     * 从层级中移除UI节点
     * @param node UI节点
     */
    removeUINode(node: Node): void;
    /**
     * 获取指定层的最顶层UI节点
     * @param layer 层级名称
     * @returns 最顶层的UI节点，如果没有则返回undefined
     */
    getTopUIInLayer(layer: string): Node | undefined;
    /**
     * 获取全局最顶层的UI节点（所有层中最顶层的）
     * @returns 最顶层的UI节点及其所属层级
     */
    getGlobalTopUI(): {
        node: Node;
        layer: string;
    } | undefined;
    /**
     * 获取指定层中的所有UI节点
     * @param layer 层级名称
     * @returns UI节点数组
     */
    getUINodesInLayer(layer: string): Node[];
    /**
     * 获取所有活跃的UI节点（所有层）
     * @returns 所有活跃的UI节点数组
     */
    getAllActiveUINodes(): Node[];
    /**
     * 调整遮罩位置
     * 将遮罩移动到全局最顶层UI的下方，并根据层级配置决定是否显示
     */
    adjustMaskLayer(): void;
    /**
     * 检查指定层是否存在
     * @param layer 层级名称
     * @returns 是否存在
     */
    hasLayer(layer: string): boolean;
    /**
     * 获取层级节点
     * @param layer 层级名称
     * @returns 层级节点
     */
    getLayer(layer: string): Node | undefined;
    /**
    * 设置遮罩配置
    */
    setMaskConfig(options: UIMaskConfig): void;
    /**
     * 设置等待视图配置
     */
    setWaitConfig(config: UIWaitConfig): void;
    /**
    * 显示等待视图
    */
    showLoading(layerName?: string): Promise<void>;
    /**
     * 隐藏等待视图
     */
    hideLoading(): void;
    /**
     * 递归设置节点及其子节点的layer属性
     * @param node 节点
     * @param layer layer值
     */
    private _setNodeLayer;
}
