import { Asset, Prefab, SpriteFrame, Sprite, sp } from "cc";
import { ICocosResManager, AssetType } from "../core";
export declare class ResLoader implements ICocosResManager {
    loadAsset<T extends Asset>(path: string, type: AssetType<T>, nameOrUrl?: string): Promise<T>;
    loadPrefab(path: string, nameOrUrl?: string): Promise<Prefab>;
    loadSpriteFrame(ref: Sprite, path: string, nameOrUrl?: string): Promise<SpriteFrame>;
    loadSpine(ref: sp.Skeleton, path: string, nameOrUrl?: string): Promise<sp.SkeletonData>;
    release(asset: Asset): void;
    release(path: string, type?: AssetType<Asset>, nameOrUrl?: string): void;
}
