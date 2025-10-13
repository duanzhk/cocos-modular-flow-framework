import { __awaiter } from '../_virtual/_tslib.js';

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
class HttpManager {
    constructor() {
        this.baseURL = ''; // 基础 URL
        this.defaultTimeout = 10000; // 默认超时时间 10 秒
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
        // 请求拦截器
        // 在请求发送之前修改请求参数，可以：
        // 添加认证信息（Token）
        // 添加通用参数（时间戳、版本号、签名等）
        // 修改请求头
        // 记录请求日志
        // 加密请求数据
        // 等等
        this.requestInterceptors = [];
        // 响应拦截器
        // 在收到响应后处理数据，可以：
        // 提取实际数据（去除包装层）
        // 统一处理错误码
        // 转换数据格式
        // 缓存响应结果
        // 等等
        this.responseInterceptors = [];
        // 错误拦截器
        // 在请求出错时处理错误，可以：
        // 显示错误提示
        // 记录错误日志
        // 重试请求
        // 等等
        this.errorInterceptors = [];
        // 正在进行的请求管理
        this.pendingRequests = new Map();
    }
    initialize() {
        // 初始化逻辑（如果需要）
    }
    dispose() {
        // 取消所有正在进行的请求
        this.cancelAllRequests();
        // 清空拦截器
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.errorInterceptors = [];
    }
    /**
     * 设置基础 URL
     */
    setBaseURL(url) {
        this.baseURL = url;
    }
    /**
     * 设置默认请求头
     */
    setDefaultHeader(key, value) {
        this.defaultHeaders[key] = value;
    }
    /**
     * 添加请求拦截器
     */
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
    }
    /**
     * 添加响应拦截器
     */
    addResponseInterceptor(interceptor) {
        this.responseInterceptors.push(interceptor);
    }
    /**
     * 添加错误拦截器
     */
    addErrorInterceptor(interceptor) {
        this.errorInterceptors.push(interceptor);
    }
    /**
     * 取消指定请求
     */
    cancelRequest(requestKey) {
        const controller = this.pendingRequests.get(requestKey);
        if (controller) {
            controller.abort();
            this.pendingRequests.delete(requestKey);
        }
    }
    /**
     * 取消所有请求
     */
    cancelAllRequests() {
        this.pendingRequests.forEach(controller => controller.abort());
        this.pendingRequests.clear();
    }
    get(url, params, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullUrl = this._buildUrlWithParams(url, params);
            return this.request({
                url: fullUrl,
                method: 'GET',
                headers: Object.assign(Object.assign({}, this.defaultHeaders), headers)
            });
        });
    }
    post(url, data, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                url,
                method: 'POST',
                headers: Object.assign(Object.assign({}, this.defaultHeaders), headers),
                data
            });
        });
    }
    put(url, data, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request({
                url,
                method: 'PUT',
                headers: Object.assign(Object.assign({}, this.defaultHeaders), headers),
                data
            });
        });
    }
    delete(url, params, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const fullUrl = this._buildUrlWithParams(url, params);
            return this.request({
                url: fullUrl,
                method: 'DELETE',
                headers: Object.assign(Object.assign({}, this.defaultHeaders), headers)
            });
        });
    }
    request(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let { url, method, headers = {}, params, data, timeout = this.defaultTimeout } = options;
            // 应用请求拦截器
            let requestOptions = Object.assign({}, options);
            for (const interceptor of this.requestInterceptors) {
                requestOptions = yield interceptor(requestOptions);
            }
            // 更新变量（拦截器可能修改了请求参数）
            ({ url, method, headers = {}, params, data, timeout = this.defaultTimeout } = requestOptions);
            // 处理 baseURL
            let fullUrl = url;
            if (this.baseURL && !url.startsWith('http')) {
                fullUrl = this.baseURL + (url.startsWith('/') ? url : '/' + url);
            }
            // 构建完整的 URL（如果还有未处理的 params）
            if (params && (method === 'GET' || method === 'DELETE')) {
                fullUrl = this._buildUrlWithParams(fullUrl, params);
            }
            // 生成请求唯一标识（用于取消请求）
            const requestKey = `${method}:${fullUrl}`;
            // 构建 fetch 选项
            const fetchOptions = {
                method,
                headers: this._normalizeHeaders(Object.assign(Object.assign({}, this.defaultHeaders), headers)),
            };
            // 添加请求体（仅适用于允许请求体的方法）
            if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
                if (data instanceof FormData) {
                    // FormData 不需要设置 Content-Type，浏览器会自动设置
                    fetchOptions.body = data;
                    // 移除 Content-Type，让浏览器自动设置正确的 boundary
                    delete fetchOptions.headers['content-type'];
                }
                else if (typeof data === 'object') {
                    fetchOptions.body = JSON.stringify(data);
                }
                else {
                    fetchOptions.body = data.toString();
                }
            }
            try {
                // 创建 AbortController（每个请求都需要独立的 controller）
                const controller = new AbortController();
                this.pendingRequests.set(requestKey, controller);
                const timeoutId = setTimeout(() => {
                    controller.abort();
                    this.pendingRequests.delete(requestKey);
                }, timeout);
                fetchOptions.signal = controller.signal;
                // 发起请求
                const response = yield fetch(fullUrl, fetchOptions);
                clearTimeout(timeoutId);
                this.pendingRequests.delete(requestKey);
                // 检查响应状态
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                // 尝试解析 JSON，如果失败则返回文本
                let result;
                try {
                    result = yield response.json();
                }
                catch (_a) {
                    result = yield response.text();
                }
                // 应用响应拦截器
                for (const interceptor of this.responseInterceptors) {
                    result = yield interceptor(result);
                }
                return result;
            }
            catch (error) {
                this.pendingRequests.delete(requestKey);
                let finalError;
                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        finalError = new Error(`Request timeout after ${timeout}ms`);
                    }
                    else {
                        finalError = new Error(`Network error: ${error.message}`);
                    }
                }
                else {
                    finalError = new Error('Unknown network error');
                }
                // 应用错误拦截器
                for (const interceptor of this.errorInterceptors) {
                    yield interceptor(finalError);
                }
                throw finalError;
            }
        });
    }
    /**
     * 构建带参数的 URL
     */
    _buildUrlWithParams(url, params) {
        if (!params)
            return url;
        const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                urlObj.searchParams.append(key, String(params[key]));
            }
        });
        // 如果原始 URL 没有协议和主机，只返回路径和查询参数
        if (!url.startsWith('http')) {
            return urlObj.pathname + urlObj.search;
        }
        return urlObj.toString();
    }
    /**
     * 标准化请求头
     */
    _normalizeHeaders(headers) {
        const normalized = {};
        Object.keys(headers).forEach(key => {
            normalized[key.toLowerCase()] = headers[key];
        });
        return normalized;
    }
}

export { HttpManager };
