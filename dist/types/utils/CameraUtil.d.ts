import { Camera, Vec3 } from "cc";
/** 摄像机工具 */
export declare class CameraUtil {
    /**
     * 当前世界坐标是否在摄像机显示范围内
     * @param camera    摄像机
     * @param worldPos  坐标
     */
    static isInView(camera: Camera, worldPos: Vec3): boolean;
}
