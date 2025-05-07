/** 字符串工具 */
export declare class StringUtil {
    /** 获取一个唯一标识的字符串 */
    static guid(): string;
    /**
     * 转美式计数字符串
     * @param value 数字
     * @example
     * 123456789 = 123,456,789
     */
    static numberTotPermil(value: number): string;
    /**
     * 转英文单位计数
     * @param value 数字
     * @param fixed 保留小数位数
     * @example
     * 12345 = 12.35K
     */
    static numberToThousand(value: number, fixed?: number): string;
    /**
     * 转中文单位计数
     * @param value 数字
     * @param fixed 保留小数位数
     * @example
     * 12345 = 1.23万
     */
    static numberToTenThousand(value: number, fixed?: number): string;
    /**
     * "," 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray1(str: string): string[];
    /**
     * "|" 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray2(str: string): string[];
    /**
     * ":" 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray3(str: string): string[];
    /**
     * ";" 分割字符串成数组
     * @param str 字符串
     */
    static stringToArray4(str: string): string[];
    /**
     * 字符串截取
     * @param str     字符串
     * @param n       截取长度
     * @param showdot 是否把截取的部分用省略号代替
     */
    static sub(str: string, n: number, showdot?: boolean): string;
    /**
     * 计算字符串长度，中文算两个字节
     * @param str 字符串
     */
    static stringLen(str: string): number;
    /**
     * 截取字符串，显示省略号
     * @param str
     * @param len
     */
    static ellipsisString(str: string, maxChars: number): string;
    /**
     * 是否为空或者空格
     * @param str
     */
    static isEmptyOrWhiteSpace(str: string): boolean;
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
    static substitute(str: string, ...rest: any[]): string;
    /**
     * 获取字符串中指定字符的全部索引
     * @param mainStr
     * @param subStr
     * @returns
     */
    static findAllSubstringsIndexes(mainStr: string, subStr: string): number[];
    /**
     * 用于将英文文本包围在 Unicode RLE 和 PDF 字符中，以确保其在 RTL 文本中正确显示
     * @param text
     * @returns
     */
    static surroundLTRWithUnicode(text: string): string;
    /**
     * 判断字符是否为双字节字符（如中文字符）
     * @param string 原字符串
     */
    static isDoubleWord(string: string): boolean;
}
