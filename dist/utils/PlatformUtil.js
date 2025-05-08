import { native, sys } from 'cc';

/** 平台数据 */
class PlatformUtil {
    /** 是否为安卓系统 */
    static isNativeAndroid() {
        if (typeof native == "undefined")
            return false;
        if (sys.isNative && sys.platform === sys.Platform.ANDROID)
            return true;
        return false;
    }
    /** 是否为苹果系统 */
    static isNativeIOS() {
        if (typeof native == "undefined")
            return false;
        if (sys.isNative && sys.os === sys.OS.IOS)
            return true;
        return false;
    }
    /** 获取平台名 */
    static getPlateform() {
        if (this.isNativeAndroid())
            return 'android';
        else if (this.isNativeIOS())
            return 'ios';
        else
            return 'h5';
    }
}

export { PlatformUtil };
