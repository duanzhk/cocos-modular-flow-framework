/** 时间工具 */
class TimeUtil {
    /** 间隔天数 */
    static daysBetween(time1, time2) {
        if (time2 == undefined || time2 == null) {
            time2 = +new Date();
        }
        let startDate = new Date(time1).toLocaleDateString();
        let endDate = new Date(time2).toLocaleDateString();
        let startTime = new Date(startDate).getTime();
        let endTime = new Date(endDate).getTime();
        let dates = Math.abs((startTime - endTime)) / (1000 * 60 * 60 * 24);
        return dates;
    }
    /** 间隔秒数 */
    static secsBetween(time1, time2) {
        if (time2 == undefined || time2 == null) {
            time2 = +new Date();
        }
        let dates = Math.abs((time2 - time1)) / (1000);
        return dates;
    }
    /**
     * 检查和上一次时间相比是否是新的一天
     * @param lastCheck 上一次检查时间
     * @returns
     */
    static isNewDay(lastCheck) {
        const lastCheckDate = lastCheck ? new Date(Date.parse(lastCheck)) : new Date(new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000);
        // 获取当前时间，并设置为当天的开始（午夜12点）  
        const now = new Date(new Date().setHours(0, 0, 0, 0));
        return now.getDate() !== lastCheckDate.getDate() || now.getMonth() !== lastCheckDate.getMonth() || now.getFullYear() !== lastCheckDate.getFullYear();
    }
    /**
     * 把时间格式化为00:00:00
     * @param seconds 时间
     * @returns
     */
    static format1(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        // 使用padStart来确保小时、分钟和秒都是两位数  
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = secs.toString().padStart(2, '0');
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
    /**
     * 时间格式化
     * @param date  时间对象
     * @param fmt   格式化字符(yyyy-MM-dd hh:mm:ss S)
     */
    static format2(date, fmt) {
        var o = {
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds(),
            "q+": Math.floor((date.getMonth() + 3) / 3),
            "S": date.getMilliseconds() // 毫秒 
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    }
    /**
     * 把时间戳转换为xx.xx.xx
     * @param timestamp 时间戳
     * @returns
     */
    static format3(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}.${month}.${day}`;
    }
}

export { TimeUtil };
