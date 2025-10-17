import { __awaiter } from '../_virtual/_tslib.js';
import { assetManager, Prefab, SpriteFrame, sp, Asset } from 'cc';

const DefaultBundle = "resources";
class ResLoader {
    loadAsset(path, type, nameOrUrl = DefaultBundle) {
        // 如果是在resources路径下，则截取resources之后的路径，否则直接使用路径
        const _path = (nameOrUrl == DefaultBundle && path.includes('resources')) ? path.split('resources/')[1] : path;
        // 加载资源的通用逻辑
        const loadFromBundle = (bundle) => {
            const cachedAsset = bundle.get(_path, type);
            if (cachedAsset) {
                cachedAsset.addRef();
                return Promise.resolve(cachedAsset);
            }
            else {
                return new Promise((resolve, reject) => {
                    bundle.load(_path, type, (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        else {
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
                assetManager.loadBundle(nameOrUrl, (err, bundle) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        loadFromBundle(bundle).then(resolve).catch(reject);
                    }
                });
            });
        }
        return loadFromBundle(bundle);
    }
    loadPrefab(path, nameOrUrl = DefaultBundle) {
        //refCount 记录的是持有者数量，不是资源份数，所以prefab也需要addRef
        return this.loadAsset(path, Prefab, nameOrUrl);
    }
    loadSpriteFrame(ref, path, nameOrUrl = DefaultBundle) {
        return __awaiter(this, void 0, void 0, function* () {
            const sf = yield this.loadAsset(path, SpriteFrame, nameOrUrl);
            if (ref === null || ref === void 0 ? void 0 : ref.isValid) {
                ref.spriteFrame = sf;
                return Promise.resolve(sf);
            }
            else {
                // 没有引用对象，释放掉资源
                this.release(path, SpriteFrame, nameOrUrl);
                return Promise.reject(new Error("Sprite is not valid"));
            }
        });
    }
    loadSpine(ref, path, nameOrUrl = DefaultBundle) {
        return __awaiter(this, void 0, void 0, function* () {
            const spine = yield this.loadAsset(path, sp.SkeletonData);
            if (ref === null || ref === void 0 ? void 0 : ref.isValid) {
                ref.skeletonData = spine;
                return Promise.resolve(spine);
            }
            else {
                // 没有引用对象，释放掉资源
                this.release(path, sp.SkeletonData, nameOrUrl);
                return Promise.reject(new Error("Spine is not valid"));
            }
        });
    }
    release(pathOrAsset, typeOrForce, nameOrUrl = DefaultBundle, forceParam = false) {
        var _a;
        let asset;
        let force = false;
        if (typeof pathOrAsset === "string") {
            if (!typeOrForce || typeof typeOrForce === "boolean") {
                throw new Error('typeOrForce is undefined, or typeOrForce is boolean! typeOrForce must be AssetType<Asset>!');
            }
            force = forceParam;
            asset = (_a = assetManager.getBundle(nameOrUrl)) === null || _a === void 0 ? void 0 : _a.get(pathOrAsset, typeOrForce);
        }
        else if (pathOrAsset instanceof Asset) {
            asset = pathOrAsset;
            force = typeof typeOrForce === 'boolean' ? typeOrForce : forceParam;
        }
        if (!asset) {
            console.warn(`${pathOrAsset} Release asset failed, asset is null or undefined`);
            return;
        }
        if (force) {
            assetManager.releaseAsset(asset);
        }
        else {
            // decRef原型：decRef (autoRelease = true)，所以引用数量为 0，则将自动释放该资源。
            asset.decRef();
        }
    }
}

export { ResLoader };
