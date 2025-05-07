/** 对象工具 */
export declare class ObjectUtil {
    /**
     * 判断指定的值是否为对象
     * @param value 值
     */
    static isObject(value: any): boolean;
    static isObjectLiteral(value: any): boolean;
    /**
     * 是否是数组
     * @param target
     */
    static isArray(target: any): boolean;
    /**
     * 深拷贝
     * @param target 目标
     */
    static deepCopy(target: any): any;
    /**
     * 拷贝对象
     * @param target 目标
     */
    static copy(target: object): object;
}
