import { assetManager, Asset, AssetManager, Prefab, SpriteFrame, Sprite, sp } from "cc";
import { ICocosResManager, AssetType } from "../core";

const DefaultBundle = "resources";
export class ResLoader implements ICocosResManager {
    loadAsset<T extends Asset>(path: string, type: AssetType<T>, nameOrUrl: string = DefaultBundle): Promise<T> {
        // 如果是在resources路径下，则截取resources之后的路径，否则直接使用路径
        const _path = (nameOrUrl == DefaultBundle && path.includes('resources')) ? path.split('resources/')[1] : path;
        // 加载资源的通用逻辑
        const loadFromBundle = (bundle: AssetManager.Bundle): Promise<T> => {
            const cachedAsset = bundle.get<T>(_path, type);
            if (cachedAsset) {
                cachedAsset.addRef();
                return Promise.resolve(cachedAsset);
            } else {
                return new Promise((resolve, reject) => {
                    bundle.load<T>(_path, type, (err: Error | null, data: T) => {
                        if (err) {
                            reject(err);
                        } else {
                            data.addRef();
                            resolve(data);
                        }
                    });
                });
            }
        };

        // 如果 bundle 未加载，先加载 bundle
        const bundle = assetManager.getBundle(nameOrUrl);
        if (!bundle) {
            return new Promise((resolve, reject) => {
                assetManager.loadBundle(nameOrUrl, (err: Error | null, bundle: AssetManager.Bundle) => {
                    if (err) {
                        reject(err);
                    } else {
                        loadFromBundle(bundle).then(resolve).catch(reject);
                    }
                });
            });
        }
        return loadFromBundle(bundle);
    }

    loadPrefab(path: string, nameOrUrl: string = DefaultBundle): Promise<Prefab> {
        //refCount 记录的是持有者数量，不是资源份数，所以prefab也需要addRef
        return this.loadAsset(path, Prefab, nameOrUrl);
    }

    async loadSpriteFrame(ref: Sprite, path: string, nameOrUrl: string = DefaultBundle): Promise<SpriteFrame> {
        const sf = await this.loadAsset(path, SpriteFrame, nameOrUrl);
        if (ref?.isValid) {
            ref.spriteFrame = sf;
            return Promise.resolve(sf);
        } else {
            // 没有引用对象，释放掉资源
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
            // 没有引用对象，释放掉资源
            this.release(path, sp.SkeletonData, nameOrUrl);
            return Promise.reject(new Error("Spine is not valid"));
        }
    }

    release(asset: Asset, force?: boolean): void
    release(path: string, type?: AssetType<Asset>, nameOrUrl?: string, force?: boolean): void
    release(pathOrAsset: string | Asset, typeOrForce?: AssetType<Asset> | boolean, nameOrUrl: string = DefaultBundle, forceParam: boolean = false) {
        let asset: Asset | null | undefined;
        let force: boolean = false;

        if (typeof pathOrAsset === "string") {
            if (!typeOrForce || typeof typeOrForce === "boolean") {
                throw new Error('typeOrForce is undefined, or typeOrForce is boolean! typeOrForce must be AssetType<Asset>!');
            }
            force = forceParam;
            asset = assetManager.getBundle(nameOrUrl)?.get(pathOrAsset, typeOrForce);
        } else if (pathOrAsset instanceof Asset) {
            asset = pathOrAsset;
            force = typeof typeOrForce === 'boolean' ? typeOrForce : forceParam;
        }
        if (!asset) {
            console.warn(`${pathOrAsset} Release asset failed, asset is null or undefined`);
            return;
        }
        if (force) {
            assetManager.releaseAsset(asset);
        } else {
            // decRef原型：decRef (autoRelease = true)，所以引用数量为 0，则将自动释放该资源。
            asset.decRef();
        }
    }

}