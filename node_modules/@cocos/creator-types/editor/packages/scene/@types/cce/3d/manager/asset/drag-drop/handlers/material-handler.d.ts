import { Node } from 'cc';
import { DragInfo, IDragEvent } from '../../../../../../../@types/private';
import { BaseHandler } from './base-handler';
/**
 * 处理拖动 Material 资源到带有 MeshRenderer 的节点上进行赋值
 */
export declare class MaterialHandler extends BaseHandler {
    acceptedTypes: string[];
    dragNode: Node[];
    get firstDragNode(): Node | null;
    private getSelectedMeshRenderer;
    private hideHighlightNode;
    private showHighlightNode;
    private getSharedMaterialPathByNode;
    private setMaterial;
    onDragLeave(event: IDragEvent, dragItems: DragInfo[]): Promise<void>;
    onDragOver(event: IDragEvent, dragItems: DragInfo[]): Promise<void>;
    onDrop(event: IDragEvent, dragItems: DragInfo[]): Promise<void>;
}
//# sourceMappingURL=material-handler.d.ts.map