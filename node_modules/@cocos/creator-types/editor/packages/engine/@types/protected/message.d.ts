import { IModuleConfig, ICroppingConfig } from '../module';

export interface message extends EditorMessageMap {
    'query-modules-config': {
        params: [],
        result: IModuleConfig,
    },
    'query-engine-modules-profile': {
        params: [string?],
        result: Promise<ICroppingConfig | null> , 
        // TODO: 我希望可以定义传递参数时返回 Promise<ICroppingConfig | null>
        // 不传递参数时返回 Promise<ICroppingConfig>
        // 但是一直不生效，目前只能先统一返回 Promise<ICroppingConfig | null>
    }
}
