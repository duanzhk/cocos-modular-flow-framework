/** 平台数据 */
export declare class PlatformUtil {
    /** 是否为安卓系统 */
    static isNativeAndroid(): boolean;
    /** 是否为苹果系统 */
    static isNativeIOS(): boolean;
    /** 获取平台名 */
    static getPlateform(): "android" | "ios" | "h5";
}
