/** 时间工具 */
export declare class TimeUtil {
    /** 间隔天数 */
    static daysBetween(time1: number | string | Date, time2: number | string | Date): number;
    /** 间隔秒数 */
    static secsBetween(time1: number, time2: number): number;
    /**
     * 检查和上一次时间相比是否是新的一天
     * @param lastCheck 上一次检查时间
     * @returns
     */
    static isNewDay(lastCheck?: any): boolean;
    /**
     * 把时间格式化为00:00:00
     * @param seconds 时间
     * @returns
     */
    static format1(seconds: number): string;
    /**
     * 时间格式化
     * @param date  时间对象
     * @param fmt   格式化字符(yyyy-MM-dd hh:mm:ss S)
     */
    static format2(date: Date, fmt: string): string;
    /**
     * 把时间戳转换为xx.xx.xx
     * @param timestamp 时间戳
     * @returns
     */
    static format3(timestamp: number): string;
}
