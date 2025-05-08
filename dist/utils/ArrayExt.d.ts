declare global {
    interface Array<T> {
        remove(filter: (v: T, i: number, arr: Array<T>) => boolean): Array<T>;
        remove(filter: T): Array<T>;
        removeOne(filter: (v: T, i: number, arr: Array<T>) => boolean): Array<T>;
        removeOne(filter: T): Array<T>;
        random(): T;
        first(): T;
        last(): T;
        max(): T;
        max<P>(mapper: (v: T, i: number, arr: this) => P): P | null;
        min(): T;
        min<P>(mapper: (v: T, i: number, arr: this) => P): P | null;
        distinct(): Array<T>;
        filterIndex(filter: (v: T, i: number, arr: this) => boolean): Array<number>;
        count(filter: (v: T, i: number, arr: this) => boolean): number;
        sum(mapper?: (v: T, i: number, arr: this) => number): number;
        average(mapper?: (v: T, i: number, arr: this) => number): number;
        /**
         * 移除指定位置的元素。注意：会改变数组顺序，原理是将最后一个元素填充到指定位置
         * @param index
         * @return 返回被移除的元素
         */
        fastRemoveAt(index: number): T;
        /**
         * 移除指定的元素。注意：会改变数组顺序，原理是将最后一个元素填充到指定位置
         * @param value
         * @return 返回是否移除成功
         */
        fastRemove(value: T): boolean;
        /**
         * 同find，但返回整个Array<T>中最后一个匹配元素
         */
        findLast(predicate: (value: T, index: number, obj: Array<T>) => boolean): T | undefined;
        /**
         * 同find，但返回整个Array<T>中最后一个匹配元素的index
         */
        findLastIndex(predicate: (value: T, index: number, obj: Array<T>) => boolean): number;
        orderBy(...mappers: ((v: T) => any)[]): Array<T>;
        orderByDesc(...mappers: ((v: T) => any)[]): Array<T>;
        /**
         * 二分查找 前提是数组一定是有序的
         * @param value 要查找的值
         * @param keyMapper 要查找的值的mapper方法（默认为查找数组元素本身）
         * @return 查找到的index，查不到返回-1
         */
        binarySearch(value: number | string, keyMapper?: (v: T) => (number | string)): number;
        /**
         * 二分插入 前提是数组一定是有序的
         * @param item 要插入的值
         * @param keyMapper 二分查找时要查找的值的mapper方法（默认为查找数组元素本身）
         * @param unique 是否去重，如果为true，则如果数组内已经有值时不插入，返回已有值的number
         * @return 返回插入的index位置
         */
        binaryInsert(item: T, unique?: boolean): number;
        binaryInsert(item: T, keyMapper: (v: T) => (number | string), unique?: boolean): number;
        /**
         * 二分去重 前提是数组一定是有序的
         * @param keyMapper 二分查找时要查找的值的mapper方法（默认为查找数组元素本身）
         */
        binaryDistinct(keyMapper?: (v: T) => (number | string)): Array<T>;
        groupBy(grouper: (v: T) => any): (T[] & {
            key: any;
        })[];
    }
}
export {};
