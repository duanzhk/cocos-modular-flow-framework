import { assetManager, Asset, AssetManager, Prefab, SpriteFrame, Sprite, sp } from "cc";
import { ICocosResManager, AssetType } from "@core";

const DefaultBundle = "resources";
export class ResLoader implements ICocosResManager {
    loadAsset<T extends Asset>(path: string, type: AssetType<T>, nameOrUrl: string = DefaultBundle): Promise<T> {
        //TODO: bundle.release和assetManager.releaseAsset的区别?
        if (assetManager.assets.has(path)) {
            const asset = assetManager.assets.get(path) as T;
            return Promise.resolve<T>(asset);
        }
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(nameOrUrl, (err: Error | null, bundle: AssetManager.Bundle) => {
                if (err) {
                    reject(err);
                } else {
                    bundle.load<T>(path, type, (err: Error | null, data: T) => {
                        if (err) {
                            reject(err);
                        } else {
                            data.addRef();
                            resolve(data);
                        }
                    });
                }
            })
        });
    }

    loadPrefab(path: string, nameOrUrl: string = DefaultBundle): Promise<Prefab> {
        return this.loadAsset(path, Prefab, nameOrUrl);
    }

    async loadSpriteFrame(ref: Sprite, path: string, nameOrUrl: string = DefaultBundle): Promise<SpriteFrame> {
        const sf = await this.loadAsset(path, SpriteFrame, nameOrUrl);
        if (ref?.isValid) {
            ref.spriteFrame = sf;
            return Promise.resolve(sf);
        } else {
            // 没有引用到的资源，释放掉
            this.release(path, SpriteFrame, nameOrUrl);
            return Promise.reject(new Error("Sprite is not valid"));
        }
    }

    async loadSpine(ref: sp.Skeleton, path: string, nameOrUrl: string = DefaultBundle): Promise<sp.SkeletonData> {
        const spine = await this.loadAsset(path, sp.SkeletonData);
        if (ref?.isValid) {
            ref.skeletonData = spine;
            return Promise.resolve(spine);
        } else {
            // 没有引用到的资源，释放掉
            this.release(path, sp.SkeletonData, nameOrUrl);
            return Promise.reject(new Error("Spine is not valid"));
        }
    }

    release(asset: Asset): void
    release(path: string, type?: AssetType<Asset>, nameOrUrl?: string): void
    release(pathOrAsset: string | Asset, type?: AssetType<Asset>, nameOrUrl: string = DefaultBundle) {
        if (typeof pathOrAsset === "string") {
            const bundle = assetManager.getBundle(nameOrUrl);
            const asset = bundle?.get(pathOrAsset, type);
            asset?.decRef();
            if (asset?.refCount === 0) {
                bundle?.release(pathOrAsset, type);
            }
        } else if (pathOrAsset instanceof Asset) {
            pathOrAsset.decRef();
            if (pathOrAsset.refCount === 0) {
                assetManager.releaseAsset(pathOrAsset);
            }
        }
    }

}