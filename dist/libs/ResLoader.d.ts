import { Asset, Prefab, SpriteFrame, Sprite, sp } from "cc";
export type AssetType<T> = new (...args: any[]) => T;
export declare class ResLoader {
    /**
     *
     * @param nameOrUrl 资源包名称或路径
     * @returns Promise<AssetManager.Bundle>
     */
    private _loadBundle;
    /**
     *
     * @param path
     * @param type
     * @param nameOrUrl
     * @returns
     */
    loadAsset<T extends Asset>(path: string, type: AssetType<T>, nameOrUrl?: string): Promise<T>;
    loadPrefab(path: string, nameOrUrl?: string): Promise<Prefab>;
    loadSpriteFrame(ref: Sprite, path: string, nameOrUrl?: string): Promise<SpriteFrame>;
    loadSpine(ref: sp.Skeleton, path: string, nameOrUrl?: string): Promise<sp.SkeletonData>;
    preloadAsset(paths: string | string[], type: AssetType<Asset>, nameOrUrl?: string): Promise<void>;
    release(asset: Asset, force?: boolean): void;
    release(path: string, type?: AssetType<Asset>, nameOrUrl?: string, force?: boolean): void;
}
