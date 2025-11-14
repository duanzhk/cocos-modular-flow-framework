/**
* HTTP 请求配置
*/
export interface HttpRequestOptions {
    /** 请求 URL */
    url: string;
    /** HTTP 方法 */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    /** 请求头 */
    headers?: Record<string, string>;
    /** URL 参数 */
    params?: Record<string, any>;
    /** 请求体数据 */
    data?: any;
    /** 超时时间（毫秒） */
    timeout?: number;
}
/**
 * HTTP 管理器实现类
 *
 *  发起请求
    ↓
    【请求拦截器】修改请求参数（如添加 token、签名等）
    ↓
    发送到服务器
    ↓
    收到响应
    ↓
    【响应拦截器】处理响应数据（如提取数据、转换格式等）
    ↓
    返回结果 ✅

    如果出错 ❌
    ↓
    【错误拦截器】统一处理错误（如显示提示、记录日志等）
 */
export declare class HttpManager {
    private baseURL;
    private defaultTimeout;
    private defaultHeaders;
    private requestInterceptors;
    private responseInterceptors;
    private errorInterceptors;
    private pendingRequests;
    initialize(): void;
    dispose(): void;
    /**
     * 设置基础 URL
     */
    setBaseURL(url: string): void;
    /**
     * 设置默认请求头
     */
    setDefaultHeader(key: string, value: string): void;
    /**
     * 添加请求拦截器
     */
    addRequestInterceptor(interceptor: (options: HttpRequestOptions) => HttpRequestOptions | Promise<HttpRequestOptions>): void;
    /**
     * 添加响应拦截器
     */
    addResponseInterceptor(interceptor: (response: any) => any | Promise<any>): void;
    /**
     * 添加错误拦截器
     */
    addErrorInterceptor(interceptor: (error: Error) => void | Promise<void>): void;
    /**
     * 取消指定请求
     */
    cancelRequest(requestKey: string): void;
    /**
     * 取消所有请求
     */
    cancelAllRequests(): void;
    get<T = any>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T>;
    post<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<T>;
    put<T = any>(url: string, data?: any, headers?: Record<string, string>): Promise<T>;
    delete<T = any>(url: string, params?: Record<string, any>, headers?: Record<string, string>): Promise<T>;
    request<T = any>(options: HttpRequestOptions): Promise<T>;
    /**
     * 构建带参数的 URL
     */
    private _buildUrlWithParams;
    /**
     * 标准化请求头
     */
    private _normalizeHeaders;
}
