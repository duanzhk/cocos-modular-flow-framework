import { Mat4, Vec2, Vec3 } from "cc";

/** 数学工具 */
export class MathUtil {
    /**
     * 角度转弧度
     */
    static readonly deg2Rad: number = Math.PI / 180;

    /**
     * 弧度转角度
     */
    static readonly rad2Deg: number = 180 / Math.PI;

    /**
     * 获得随机方向
     * @param x -1为左，1为右
     * @returns 
     */
    static sign(x: number) {
        if (x > 0) {
            return 1;
        }
        if (x < 0) {
            return -1;
        }
        return 0;
    }

    /**
     * 随时间变化进度值
     * @param start 初始值
     * @param end   结束值
     * @param t     时间
     */
    static progress(start: number, end: number, t: number) {
        return start + (end - start) * t;
    }

    /**
     * 插值
     * @param numStart 开始数值
     * @param numEnd   结束数值
     * @param t        时间
     */
    static lerp(numStart: number, numEnd: number, t: number): number {
        if (t > 1) {
            t = 1;
        }
        else if (t < 0) {
            t = 0
        }

        return numStart * (1 - t) + (numEnd * t);
    }

    /**
     * 角度插值
     * @param angle1 角度1
     * @param angle2 角度2
     * @param t      时间
     */
    static lerpAngle(current: number, target: number, t: number): number {
        current %= 360;
        target %= 360;

        var dAngle: number = target - current;

        if (dAngle > 180) {
            target = current - (360 - dAngle);
        }
        else if (dAngle < -180) {
            target = current + (360 + dAngle);
        }

        return (MathUtil.lerp(current, target, t) % 360 + 360) % 360;
    }

    /**
     * 按一定的速度从一个角度转向令一个角度
     * @param current 当前角度
     * @param target  目标角度
     * @param speed   速度
     */
    static angleTowards(current: number, target: number, speed: number): number {
        current %= 360;
        target %= 360;

        var dAngle: number = target - current;

        if (dAngle > 180) {
            target = current - (360 - dAngle);
        }
        else if (dAngle < -180) {
            target = current + (360 + dAngle);
        }

        var dir = target - current;

        if (speed > Math.abs(dir)) {
            return target;
        }

        return ((current + speed * Math.sign(dir)) % 360 + 360) % 360;
    }

    /**
     * 获取方位内值，超过时获取对应边界值
     * @param value     值
     * @param minLimit  最小值
     * @param maxLimit  最大值
     */
    static clamp(value: number, minLimit: number, maxLimit: number) {
        if (value < minLimit) {
            return minLimit;
        }

        if (value > maxLimit) {
            return maxLimit;
        }

        return value;
    }

    /**
     * 获得一个值的概率
     * @param value 值
     */
    static probability(value: number) {
        return Math.random() < value;
    }

    /**
     * 整数随机
     * @param min 
     * @param max 
     * @returns 
     */
    static randomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 随机算法, 均匀分布法
     * @param rangeStart 
     * @param rangeEnd 
     * @param count 
     * @returns 
     */
    static generateUniformNumbers(rangeStart: number, rangeEnd: number, count: number, sort?: boolean): number[] {
        const rangeSize = rangeEnd - rangeStart;
        const step = Math.floor(rangeSize / (count - 1));

        // Uniform distribution method
        let uniformNumbers: number[] = [];
        for (let i = 0; i < count; i++) {
            let v = rangeStart + i * step + Math.random()
            uniformNumbers.push(v);
        }
        if (sort) uniformNumbers.sort((a, b) => a - b);
        return uniformNumbers
    }

    /**
     * 随机算法，黄金分割法
     * @param rangeStart 
     * @param rangeEnd 
     * @param count 
     * @returns 
     */
    static generateGoldenNumbers(rangeStart: number, rangeEnd: number, count: number): number[] {
        if (count > rangeEnd - rangeStart + 1) {
            throw new Error("Count cannot be larger than the size of the range.");
        }

        const rangeSize = rangeEnd - rangeStart;

        // Golden ratio method
        const goldenRatio = (Math.sqrt(5) - 1) / 2;
        let goldenNumbers: number[] = [];
        for (let i = 0; i < count; i++) {
            let v = rangeStart + (goldenRatio * i) % rangeSize
            goldenNumbers.push(v);
        }
        goldenNumbers.sort((a, b) => a - b);

        return goldenNumbers;
    }

    static calculateDistance(point1: Vec2, point2: Vec2): number {
        const deltaX = point2.x - point1.x;
        const deltaY = point2.y - point1.y;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    }

    /**
     * 随时间变化进度值
     * @param start  起始位置
     * @param end    结束位置
     * @param t      进度[0，1]
     */
    static progressV3(start: Vec3, end: Vec3, t: number): Vec3 {
        var current = new Vec3();
        current.x = MathUtil.progress(start.x, end.x, t);
        current.y = MathUtil.progress(start.y, end.y, t);
        current.z = MathUtil.progress(start.z, end.z, t);
        return current;
    }

    /**
     * 求两个三维向量的和
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static add(pos1: Vec3, pos2: Vec3): Vec3 {
        var outPos: Vec3 = new Vec3();
        Vec3.add(outPos, pos1, pos2);
        return outPos;
    }

    /**
     * 求两个三维向量的差
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static subV3(pos1: Vec3, pos2: Vec3): Vec3 {
        var outPos: Vec3 = new Vec3();
        Vec3.subtract(outPos, pos1, pos2);
        return outPos;
    }

    /**
     * 三维向量乘以常量
     * @param pos     向量
     * @param scalar  常量
     */
    static mul(pos: Vec3, scalar: number): Vec3 {
        var outPos: Vec3 = new Vec3();
        Vec3.multiplyScalar(outPos, pos, scalar);
        return outPos;
    }

    /**
     * 三维向量除常量
     * @param pos     向量
     * @param scalar  常量
     */
    static div(pos: Vec3, scalar: number): Vec3 {
        var outPos: Vec3 = new Vec3();

        outPos.x = pos.x / scalar;
        outPos.y = pos.y / scalar;
        outPos.z = pos.z / scalar;

        return outPos;
    }

    /**
     * 判断两个三维向量的值是否相等
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static equals(pos1: Vec3, pos2: Vec3): boolean {
        if (pos1.x == pos2.x && pos1.y == pos2.y && pos1.z == pos2.z) {
            return true;
        }

        return false;
    }

    /**
     * 三维向量的模
     * @param pos  向量
     */
    static magnitude(pos: Vec3): number {
        return pos.length();
    }

    /**
     * 三维向量归一化
     * @param pos  向量
     */
    static normalize(pos: Vec3): Vec3 {
        var outPos: Vec3 = new Vec3(pos.x, pos.y, pos.z);
        return outPos.normalize();
    }

    /**
     * 获得位置1，到位置2的方向
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static direction(pos1: Vec3, pos2: Vec3): Vec3 {
        var outPos: Vec3 = new Vec3();
        Vec3.subtract(outPos, pos2, pos1)
        return outPos.normalize();
    }

    /**
     * 获得两点间的距离
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static distance(pos1: Vec3, pos2: Vec3): number {
        return Vec3.distance(pos1, pos2);
    }

    /**
     * 插值运算
     * @param posStart  开始俏步
     * @param posEnd    结束位置
     * @param t         时间
     */
    static lerpV3(posStart: Vec3, posEnd: Vec3, t: number): Vec3 {
        return MathUtil.bezierOne(t, posStart, posEnd);
    }

    /**
     * 球面插值
     * @param from  起点
     * @param to    终点
     * @param t     时间
     */
    static slerp(from: Vec3, to: Vec3, t: number): Vec3 {
        if (t <= 0) {
            return from;
        }
        else if (t >= 1) {
            return to;
        }

        var dir: Vec3 = MathUtil.rotateTo(from, to, (Vec3.angle(from, to) / Math.PI * 180) * t);
        var lenght: number = to.length() * t + from.length() * (1 - t);

        return (dir.normalize()).multiplyScalar(lenght);
    }

    /**
     * 向量旋转一个角度
     * @param from  起点
     * @param to    终点
     * @param angle 角并
     */
    static rotateTo(from: Vec3, to: Vec3, angle: number): Vec3 {
        //如果两个方向角度为0，则返回目标
        if (Vec3.angle(from, to) == 0) {
            return to;
        }

        var axis: Vec3 = new Vec3()                 // 获得旋转轴
        Vec3.cross(axis, from, to);
        axis.normalize();

        var radian: number = angle * Math.PI / 180; // 获得弧度
        var rotateMatrix: Mat4 = new Mat4();
        rotateMatrix.rotate(radian, axis);

        return new Vec3(
            from.x * rotateMatrix.m00 + from.y * rotateMatrix.m04 + from.z * rotateMatrix.m08,
            from.x * rotateMatrix.m01 + from.y * rotateMatrix.m05 + from.z * rotateMatrix.m09,
            from.x * rotateMatrix.m02 + from.y * rotateMatrix.m06 + from.z * rotateMatrix.m10
        );
    }

    /**
     * 一次贝塞尔即为线性插值函数
     * @param t 
     * @param posStart 
     * @param posEnd 
     * @returns 
     */
    static bezierOne(t: number, posStart: Vec3, posEnd: Vec3): Vec3 {
        if (t > 1) {
            t = 1;
        }
        else if (t < 0) {
            t = 0
        }

        var pStart: Vec3 = posStart.clone();
        var pEnd: Vec3 = posEnd.clone();

        return pStart.multiplyScalar(1 - t).add(pEnd.multiplyScalar(t));
    }

    /**
     * 二次贝塞尔曲线
     * @param t 
     * @param posStart 
     * @param posCon 
     * @param posEnd 
     * @returns 
     */
    static bezierTwo(t: number, posStart: Vec3, posCon: Vec3, posEnd: Vec3): Vec3 {
        if (t > 1) {
            t = 1;
        }
        else if (t < 0) {
            t = 0
        }

        var n = (1 - t);
        var tt = t * t;

        var pStart: Vec3 = posStart.clone();
        var pos = new Vec3();

        var pCon: Vec3 = posCon.clone();
        var pEnd: Vec3 = posEnd.clone();

        pos.add(pStart.multiplyScalar(n * n));
        pos.add(pCon.multiplyScalar(2 * n * t));
        pos.add(pEnd.multiplyScalar(tt));

        return pos;
    }

    /**
     * 三次贝塞尔
     * @param t 
     * @param posStart 
     * @param posCon1 
     * @param posCon2 
     * @param posEnd 
     * @returns 
     */
    static bezierThree(t: number, posStart: Vec3, posCon1: Vec3, posCon2: Vec3, posEnd: Vec3): Vec3 {
        if (t > 1) {
            t = 1;
        }
        else if (t < 0) {
            t = 0
        }

        var n = (1 - t);
        var nn = n * n;
        var nnn = nn * n;
        var tt = t * t;
        var ttt = tt * t;

        var pStart: Vec3 = posStart.clone();
        var pos = posStart.clone();

        var pCon1: Vec3 = posCon1.clone();
        var pCon2: Vec3 = posCon2.clone();
        var pEnd: Vec3 = posEnd.clone();

        pos.add(pStart.multiplyScalar(nnn));
        pos.add(pCon1.multiplyScalar(3 * nn * t));
        pos.add(pCon2.multiplyScalar(3 * n * tt));
        pos.add(pEnd.multiplyScalar(ttt));

        return pos;
    }

    /**
     * 点乘
     * @param dir1 方向量1
     * @param dir2 方向量2
     */
    static dot(dir1: Vec3, dir2: Vec3): number {
        var tempDir1: Vec3 = dir1;
        var tempDir2: Vec3 = dir2;

        return tempDir1.x * tempDir2.x + tempDir1.y * tempDir2.y + tempDir1.z * tempDir2.z;
    }

    /**
     * 叉乘
     * @param dir1 方向量1
     * @param dir2 方向量2
     */
    static cross(dir1: Vec3, dir2: Vec3): Vec3 {
        var i: Vec3 = new Vec3(1, 0, 0);
        var j: Vec3 = new Vec3(0, 1, 0);
        var k: Vec3 = new Vec3(0, 0, 1);

        var tempDir1: Vec3 = new Vec3(dir1.x, dir1.y, dir1.z);
        var tempDir2: Vec3 = new Vec3(dir2.x, dir2.y, dir2.z);

        var iv: Vec3 = i.multiplyScalar(tempDir1.y * tempDir2.z - tempDir2.y * tempDir1.z);
        var jv: Vec3 = j.multiplyScalar(tempDir2.x * tempDir1.z - tempDir1.x * tempDir2.z);
        var kv: Vec3 = k.multiplyScalar(tempDir1.x * tempDir2.y - tempDir2.x * tempDir1.y);

        return iv.add(jv).add(kv);
    }

    /**
     * 获得两个方向向量的角度
     * @param dir1 方向量1
     * @param dir2 方向量2
     */
    static angle(dir1: Vec3, dir2: Vec3): number {
        var dotValue = MathUtil.dot(dir1.clone().normalize(), dir2.clone().normalize());
        return Math.acos(dotValue) / Math.PI * 180 * Math.sign(dotValue);
    }

    /**
     * 获得方向a到方向b的角度（带有方向的角度）
     * @param a 角度a
     * @param b 角度b
     */
    static dirAngle(a: Vec3, b: Vec3): number {
        var c: Vec3 = MathUtil.cross(a, b);
        var angle: number = MathUtil.angle(a, b);
        // a 到 b 的夹角
        var sign = Math.sign(MathUtil.dot(c.normalize(), MathUtil.cross(b.normalize(), a.normalize())));

        return angle * sign;
    }
}
