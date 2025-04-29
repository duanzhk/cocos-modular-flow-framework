import { Camera, geometry, Node, renderer, Scene, Vec3, SkyboxInfo } from 'cc';
import { PreviewBase } from './preview-base';
import { PreviewWorldAxis } from './preview-axis';
import { Grid } from './grid';
/**
 * 可交互的Preview窗口基类，可以在窗口中方便的预览场景中的元素
 */
declare class InteractivePreview extends PreviewBase {
    protected scene: Scene;
    protected cameraComp: Camera;
    protected camera: renderer.scene.Camera | any;
    protected worldAxisNode: Node;
    protected isMouseLeft: boolean;
    protected isMouseMiddle: boolean;
    protected enableAxis: boolean;
    protected worldAxis: PreviewWorldAxis | null;
    protected enableGrid: boolean;
    protected grid: Grid | null;
    protected enableSkybox: boolean;
    protected skybox: SkyboxInfo | null;
    protected get wheelSpeed(): number;
    protected wheelBaseScale: number;
    private lastMouseWheelDeltaY;
    private maxMouseWheelDeltaY;
    protected disableMouseWheel: boolean;
    protected disableRotate: boolean;
    protected disablePan: boolean;
    private get is2D();
    initScene(registerName: string, queryName: string): void;
    createNodes(scene: Scene): void;
    initCamera(registerName: string): void;
    initSceneCamera(): void;
    loadScene(): void;
    initPreviewWorldAxis(): void;
    initGrid(): void;
    init(registerName: string, queryName: string): void;
    resetCamera(modelNode: Node): void;
    protected autoPerfectCameraViewOnModel(model: Node): void;
    panningSpeed: number;
    orbitRotateSpeed: number;
    viewDist: number;
    viewCenter: Vec3;
    private _isMouseDown;
    private _right;
    private _up;
    private _v3a;
    private _v3b;
    private _curPos;
    private _curRot;
    private _forward;
    protected perfectCameraView(boundary: geometry.AABB | null | undefined): void;
    onMouseDown(event: any): void;
    onMouseMove(event: MouseEvent): void;
    onMouseUp(event: MouseEvent): void;
    onMouseWheel(event: any): void;
    protected _modelNode: Node | undefined;
    onKeyDown(event: KeyboardEvent): void;
    protected scale(delta: number): void;
    protected rotate(dx: number, dy: number): void;
    protected pan(dx: number, dy: number): void;
    updateViewCenterByDist(viewDist: number): void;
    hide(): void;
}
export { InteractivePreview };
//# sourceMappingURL=Interactive-preview.d.ts.map