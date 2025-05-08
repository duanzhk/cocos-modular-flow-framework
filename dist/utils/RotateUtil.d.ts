import { Node, Vec3 } from "cc";
/** 旋转工具 */
export declare class RotateUtil {
    /**
     * 自由旋转
     * @param target     旋转目标
     * @param axis       围绕旋转的轴
     * @param rad        旋转弧度
     */
    static rotateAround(target: Node, axis: Vec3, rad: number): void;
    /**
     * 参考瞄准目标,使当前物体围绕瞄准目标旋转
     * 1、先通过弧度计算旋转四元数
     * 2、通过旋转中心点或当前目标点向量相减计算出移动方向
     * 3、计算起始向量旋转后的向量
     * 4、计算旋转后的坐标点
     * @param lookAt  瞄准目标
     * @param target        旋转目标
     * @param axis          围绕旋转的轴(例：Vec3.UP为Y轴)
     * @param rad           旋转弧度(例：delta.x * 1e-2)
     */
    static rotateAroundTarget(lookAt: Node, target: Node, axis: Vec3, rad: number): void;
    /**
     * 获取心半径边上的位置
     * @param center    圆心
     * @param radius    半径
     * @param angle     角度
     */
    static circularEdgePosition(center: Vec3, radius: number, angle: number): Vec3;
}
