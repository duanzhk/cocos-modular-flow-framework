/** 数组工具 */
export declare class ArrayUtil {
    /**
     * 数组去重，并创建一个新数组返回
     * @param arr  源数组
     */
    static noRepeated(arr: any[]): any[];
    /**
     * 复制二维数组
     * @param array 目标数组
     */
    static copy2DArray(array: any[][]): any[][];
    /**
     * Fisher-Yates Shuffle 随机置乱算法
     * @param array 目标数组
     */
    static fisherYatesShuffle(array: any[]): any[];
    /**
     * 混淆数组
     * @param array 目标数组
     */
    static confound(array: []): any[];
    /**
     * 数组扁平化
     * @param array 目标数组
     */
    static flattening(array: any[]): any[];
    /** 删除数组中指定项 */
    static removeItem(array: any[], item: any): void;
    /**
     * 合并数组
     * @param array1 目标数组1
     * @param array2 目标数组2
     */
    static combineArrays(array1: any[], array2: any[]): any[];
    /**
     * 获取随机数组成员
     * @param array 目标数组
     */
    static getRandomValueInArray(array: any[]): any;
}
