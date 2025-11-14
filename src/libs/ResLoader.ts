import { assetManager, Asset, AssetManager, Prefab, SpriteFrame, Sprite, sp, path } from "cc";

export type AssetType<T> = new (...args: any[]) => T;

const DefaultBundle = "resources";

export class ResLoader {
    /**
     * 
     * @param nameOrUrl 资源包名称或路径
     * @returns Promise<AssetManager.Bundle>
     */
    private _loadBundle(nameOrUrl: string = DefaultBundle): Promise<AssetManager.Bundle> {
        const bundleName = path.basename(nameOrUrl);
        const bundle = assetManager.getBundle(bundleName);
        if (bundle) {
            return Promise.resolve(bundle);
        }
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(nameOrUrl, (err: Error | null, bundle: AssetManager.Bundle) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(bundle);
                }
            });
        })
    }

    /**
     * 
     * @param path 
     * @param type 
     * @param nameOrUrl 
     * @returns 
     */
    async loadAsset<T extends Asset>(path: string, type: AssetType<T>, nameOrUrl: string = DefaultBundle): Promise<T> {
        // 加载资源的通用逻辑
        const _loadFromBundle = (bundle: AssetManager.Bundle): Promise<T> => {
            // 如果是在resources路径下，则截取resources之后的路径，否则直接使用路径
            let assetPath = (nameOrUrl == DefaultBundle && path.includes('resources')) ? path.split('resources/')[1] : path;
            // 删除后缀
            assetPath = assetPath.replace(/\.[^/.]+$/, '');
            const cachedAsset = bundle.get<T>(assetPath, type);
            if (cachedAsset) {
                cachedAsset.addRef();
                return Promise.resolve(cachedAsset);
            } else {
                return new Promise((resolve, reject) => {
                    bundle.load<T>(assetPath, type, (err: Error | null, data: T) => {
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

        const bundle = await this._loadBundle(nameOrUrl);
        return _loadFromBundle(bundle);
    }

    async loadPrefab(path: string, nameOrUrl: string = DefaultBundle): Promise<Prefab> {
        //refCount 记录的是持有者数量，不是资源份数，所以prefab也需要addRef
        return await this.loadAsset(path, Prefab, nameOrUrl);
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

    async preloadAsset(paths: string | string[], type: AssetType<Asset>, nameOrUrl: string = DefaultBundle) {
        const bundle = await this._loadBundle(nameOrUrl);
        new Promise((resolve, reject) => {
            bundle.preload(paths, type, (err: Error | null, data: AssetManager.RequestItem[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
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