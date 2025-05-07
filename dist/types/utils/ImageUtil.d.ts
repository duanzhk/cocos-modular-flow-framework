import { Color, Texture2D } from "cc";
/**
 * 图像工具
 */
export declare class ImageUtil {
    /**
     * 获取纹理中指定像素的颜色，原点为左上角，从像素 (1, 1) 开始。
     * @param texture 纹理
     * @param x x 坐标
     * @param y y 坐标
     * @example
        // 获取纹理左上角第一个像素的颜色
        const color = ImageUtil.getPixelColor(texture, 1, 1);
        cc.color(50, 100, 123, 255);
     */
    static getPixelColor(texture: Texture2D, x: number, y: number): Color;
    /**
     * 将图像转为 Base64 字符（仅 png、jpg 或 jpeg 格式资源）（有问题）
     * @param url 图像地址
     * @param callback 完成回调
     */
    static imageToBase64(url: string, callback?: (dataURL: string) => void): Promise<string>;
    /**
     * 将 Base64 字符转为 cc.Texture2D 资源（有问题）
     * @param base64 Base64 字符
     */
    static base64ToTexture(base64: string): Texture2D;
    /**
     * 将 Base64 字符转为二进制数据（有问题）
     * @param base64 Base64 字符
     */
    static base64ToBlob(base64: string): Blob;
}
