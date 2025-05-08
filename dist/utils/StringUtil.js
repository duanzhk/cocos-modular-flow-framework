import { ObjectUtil } from './ObjectUtil.js';

/** 字符串工具 */
class StringUtil {
    /** 获取一个唯一标识的字符串 */
    static guid() {
        let guid = "";
        for (let i = 1; i <= 32; i++) {
            let n = Math.floor(Math.random() * 16.0).toString(16);
            guid += n;
            if ((i == 8) || (i == 12) || (i == 16) || (i == 20))
                guid += "-";
        }
        return guid;
    }
    /**
     * 转美式计数字符串
     * @param value 数字
     * @example
     * 123456789 = 123,456,789
     */
    static numberTotPermil(value) {
        return value.toLocaleString();
    }
    /**
     * 转英文单位计数
     * @param value 数字
     * @param fixed 保留小数位数
     * @example
     * 12345 = 12.35K
     */
    static numberToThousand(value, fixed = 2) {
        var k = 1000;
        var sizes = ['', 'K', 'M', 'G'];
        if (value < k) {
            return value.toString();
        }
        else {
            var i = Math.floor(Math.log(value) / Math.log(k));
            var r = ((value / Math.pow(k, i)));
            return r.toFixed(fixed) + sizes[i];
        }
    }
    /**
     * 转中文单位计数
     * @param value 数字
     * @param fixed 保留小数位数
     * @example
     * 12345 = 1.23万
     */
    static numberToTenThousand(value, fixed = 2) {
        var k = 10000;
        var sizes = ['', '万', '亿', '万亿'];
        if (value < k) {
            return value.toString();
        }
        else {
            var i = Math.floor(Math.log(value) / Math.log(k));
            return ((value / Math.pow(k, i))).toFixed(fixed) + sizes[i];
        }
    }
    /**
     * "," 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray1(str) {
        if (str == "") {
            return [];
        }
        return str.split(",");
    }
    /**
     * "|" 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray2(str) {
        if (str == "") {
            return [];
        }
        return str.split("|");
    }
    /**
     * ":" 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray3(str) {
        if (str == "") {
            return [];
        }
        return str.split(":");
    }
    /**
     * ";" 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray4(str) {
        if (str == "") {
            return [];
        }
        return str.split(";");
    }
    /**
     * 字符串截取
     * @param str     字符串
     * @param n       截取长度
     * @param showdot 是否把截取的部分用省略号代替
     */
    static sub(str, n, showdot = false) {
        var r = /[^\x00-\xff]/g;
        if (str.replace(r, "mm").length <= n) {
            return str;
        }
        var m = Math.floor(n / 2);
        for (var i = m; i < str.length; i++) {
            if (str.substr(0, i).replace(r, "mm").length >= n) {
                if (showdot) {
                    return str.substr(0, i) + "...";
                }
                else {
                    return str.substr(0, i);
                }
            }
        }
        return str;
    }
    /**
     * 计算字符串长度，中文算两个字节
     * @param str 字符串
     */
    static stringLen(str) {
        var realLength = 0, len = str.length, charCode = -1;
        for (var i = 0; i < len; i++) {
            charCode = str.charCodeAt(i);
            if (charCode >= 0 && charCode <= 128)
                realLength += 1;
            else
                realLength += 2;
        }
        return realLength;
    }
    /**
     * 截取字符串，显示省略号
     * @param str
     * @param len
     */
    static ellipsisString(str, maxChars) {
        if (this.isEmptyOrWhiteSpace(str))
            return "";
        if (str.length > maxChars) {
            let truncatedText = str.substring(0, maxChars);
            return `${truncatedText}...`;
        }
        else {
            return str;
        }
    }
    /**
     * 是否为空或者空格
     * @param str
     */
    static isEmptyOrWhiteSpace(str) {
        return !str || str.trim() == '';
    }
    /**
     * 参数替换
     * @param  str
     * @param  rest
     *
     * @example
     *
     * var str:string = "here is some info '{0}' and {1}";
     * StringUtil.substitute(str, 15.4, true);
     * "here is some info '15.4' and true"
     *
     *  const result = substitute("Hello, {name}! Today is {day}.", "John Doe", "Monday");
     *  console.log(result); // 输出: Hello, John Doe! Today is Monday.
     *
     *  const result2 = substitute("The value of {abc} is {num} and the variable {xyz} has the value {value}.", {abc: 123, num: "456", xyz: "789", value: "hello"});
     *  console.log(result2); // 输出: The value of 123 is 456 and the variable 789 has the value hello.
     */
    static substitute(str, ...rest) {
        if (str == null)
            return '';
        var args;
        let parseByDic = rest.length == 1 && ObjectUtil.isObjectLiteral(rest[0]);
        if (parseByDic || (rest.length == 1 && rest[0] instanceof Array)) {
            args = rest[0];
        }
        else {
            args = rest;
        }
        // 创建一个正则表达式来匹配所有的大括号占位符
        const placeholderRegex = /\{([\w-]+)\}/g;
        if (parseByDic) {
            return str.replace(placeholderRegex, (match, key) => {
                return args[key];
            });
        }
        else {
            // 构建一个映射，将大括号中的内容映射到实际值
            const placeholders = new Map();
            let match = str.matchAll(placeholderRegex);
            let i = 0;
            for (const element of match) {
                placeholders.set(element[0], args[i]);
                i++;
            }
            // 使用映射替换占位符
            return str.replace(placeholderRegex, (match, key) => {
                const replacement = placeholders.get(match);
                return replacement !== undefined ? replacement : match;
            });
        }
    }
    /**
     * 获取字符串中指定字符的全部索引
     * @param mainStr
     * @param subStr
     * @returns
     */
    static findAllSubstringsIndexes(mainStr, subStr) {
        const indexes = [];
        let currentIndex = mainStr.indexOf(subStr);
        while (currentIndex !== -1) {
            indexes.push(currentIndex);
            currentIndex = mainStr.indexOf(subStr, currentIndex + subStr.length);
        }
        return indexes;
    }
    /**
     * 用于将英文文本包围在 Unicode RLE 和 PDF 字符中，以确保其在 RTL 文本中正确显示
     * @param text
     * @returns
     */
    static surroundLTRWithUnicode(text) {
        // 使用正则表达式匹配连续的英文单词，并在其前后添加 \u202B 和 \u202C
        return text.replace(/([a-zA-Z\s]+)/g, (match) => {
            // 检查匹配到的字符串是否包含英文字符
            if (/[a-zA-Z]/.test(match)) {
                return `\u202B${match}\u202C`;
            }
            return match;
        });
    }
    /**
     * 判断字符是否为双字节字符（如中文字符）
     * @param string 原字符串
     */
    static isDoubleWord(string) {
        return /[^\x00-\xff]/.test(string);
    }
}

export { StringUtil };
