import { Vec2, Vec3 } from "cc";
/** 数学工具 */
export declare class MathUtil {
    /**
     * 角度转弧度
     */
    static readonly deg2Rad: number;
    /**
     * 弧度转角度
     */
    static readonly rad2Deg: number;
    /**
     * 获得随机方向
     * @param x -1为左，1为右
     * @returns
     */
    static sign(x: number): 0 | 1 | -1;
    /**
     * 随时间变化进度值
     * @param start 初始值
     * @param end   结束值
     * @param t     时间
     */
    static progress(start: number, end: number, t: number): number;
    /**
     * 插值
     * @param numStart 开始数值
     * @param numEnd   结束数值
     * @param t        时间
     */
    static lerp(numStart: number, numEnd: number, t: number): number;
    /**
     * 角度插值
     * @param angle1 角度1
     * @param angle2 角度2
     * @param t      时间
     */
    static lerpAngle(current: number, target: number, t: number): number;
    /**
     * 按一定的速度从一个角度转向令一个角度
     * @param current 当前角度
     * @param target  目标角度
     * @param speed   速度
     */
    static angleTowards(current: number, target: number, speed: number): number;
    /**
     * 获取方位内值，超过时获取对应边界值
     * @param value     值
     * @param minLimit  最小值
     * @param maxLimit  最大值
     */
    static clamp(value: number, minLimit: number, maxLimit: number): number;
    /**
     * 获得一个值的概率
     * @param value 值
     */
    static probability(value: number): boolean;
    /**
     * 整数随机
     * @param min
     * @param max
     * @returns
     */
    static randomInt(min: number, max: number): number;
    /**
     * 随机算法, 均匀分布法
     * @param rangeStart
     * @param rangeEnd
     * @param count
     * @returns
     */
    static generateUniformNumbers(rangeStart: number, rangeEnd: number, count: number, sort?: boolean): number[];
    /**
     * 随机算法，黄金分割法
     * @param rangeStart
     * @param rangeEnd
     * @param count
     * @returns
     */
    static generateGoldenNumbers(rangeStart: number, rangeEnd: number, count: number): number[];
    static calculateDistance(point1: Vec2, point2: Vec2): number;
    /**
     * 随时间变化进度值
     * @param start  起始位置
     * @param end    结束位置
     * @param t      进度[0，1]
     */
    static progressV3(start: Vec3, end: Vec3, t: number): Vec3;
    /**
     * 求两个三维向量的和
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static add(pos1: Vec3, pos2: Vec3): Vec3;
    /**
     * 求两个三维向量的差
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static subV3(pos1: Vec3, pos2: Vec3): Vec3;
    /**
     * 三维向量乘以常量
     * @param pos     向量
     * @param scalar  常量
     */
    static mul(pos: Vec3, scalar: number): Vec3;
    /**
     * 三维向量除常量
     * @param pos     向量
     * @param scalar  常量
     */
    static div(pos: Vec3, scalar: number): Vec3;
    /**
     * 判断两个三维向量的值是否相等
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static equals(pos1: Vec3, pos2: Vec3): boolean;
    /**
     * 三维向量的模
     * @param pos  向量
     */
    static magnitude(pos: Vec3): number;
    /**
     * 三维向量归一化
     * @param pos  向量
     */
    static normalize(pos: Vec3): Vec3;
    /**
     * 获得位置1，到位置2的方向
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static direction(pos1: Vec3, pos2: Vec3): Vec3;
    /**
     * 获得两点间的距离
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static distance(pos1: Vec3, pos2: Vec3): number;
    /**
     * 插值运算
     * @param posStart  开始俏步
     * @param posEnd    结束位置
     * @param t         时间
     */
    static lerpV3(posStart: Vec3, posEnd: Vec3, t: number): Vec3;
    /**
     * 球面插值
     * @param from  起点
     * @param to    终点
     * @param t     时间
     */
    static slerp(from: Vec3, to: Vec3, t: number): Vec3;
    /**
     * 向量旋转一个角度
     * @param from  起点
     * @param to    终点
     * @param angle 角并
     */
    static rotateTo(from: Vec3, to: Vec3, angle: number): Vec3;
    /**
     * 一次贝塞尔即为线性插值函数
     * @param t
     * @param posStart
     * @param posEnd
     * @returns
     */
    static bezierOne(t: number, posStart: Vec3, posEnd: Vec3): Vec3;
    /**
     * 二次贝塞尔曲线
     * @param t
     * @param posStart
     * @param posCon
     * @param posEnd
     * @returns
     */
    static bezierTwo(t: number, posStart: Vec3, posCon: Vec3, posEnd: Vec3): Vec3;
    /**
     * 三次贝塞尔
     * @param t
     * @param posStart
     * @param posCon1
     * @param posCon2
     * @param posEnd
     * @returns
     */
    static bezierThree(t: number, posStart: Vec3, posCon1: Vec3, posCon2: Vec3, posEnd: Vec3): Vec3;
    /**
     * 点乘
     * @param dir1 方向量1
     * @param dir2 方向量2
     */
    static dot(dir1: Vec3, dir2: Vec3): number;
    /**
     * 叉乘
     * @param dir1 方向量1
     * @param dir2 方向量2
     */
    static cross(dir1: Vec3, dir2: Vec3): Vec3;
    /**
     * 获得两个方向向量的角度
     * @param dir1 方向量1
     * @param dir2 方向量2
     */
    static angle(dir1: Vec3, dir2: Vec3): number;
    /**
     * 获得方向a到方向b的角度（带有方向的角度）
     * @param a 角度a
     * @param b 角度b
     */
    static dirAngle(a: Vec3, b: Vec3): number;
}
