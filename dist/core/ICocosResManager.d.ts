import { IResManager } from "./Api";
import { Asset, Prefab, sp, Sprite, SpriteFrame } from "cc";
export type AssetType<T> = new (...args: any[]) => T;
export interface ICocosResManager extends IResManager {
    loadAsset<T extends Asset>(path: string, type: AssetType<T>, nameOrUrl?: string): Promise<T>;
    loadPrefab(path: string, nameOrUrl?: string): Promise<Prefab>;
    loadSpriteFrame(ref: Sprite, path: string, nameOrUrl?: string): Promise<SpriteFrame>;
    loadSpine(ref: sp.Skeleton, path: string, nameOrUrl?: string): Promise<sp.SkeletonData>;
    release(asset: Asset): void;
    release(path: string, type?: AssetType<Asset>, nameOrUrl?: string): void;
}
