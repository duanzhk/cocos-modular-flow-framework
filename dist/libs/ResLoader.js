import { __awaiter } from '../_virtual/_tslib.js';
import { assetManager, Prefab, Asset, SpriteFrame, sp } from 'cc';

const DefaultBundle = "resources";
class ResLoader {
    loadAsset(path, type, nameOrUrl = DefaultBundle) {
        //TODO: bundle.release和assetManager.releaseAsset的区别?
        if (assetManager.assets.has(path)) {
            const asset = assetManager.assets.get(path);
            return Promise.resolve(asset);
        }
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(nameOrUrl, (err, bundle) => {
                if (err) {
                    reject(err);
                }
                else {
                    bundle.load(path, type, (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            data.addRef();
                            resolve(data);
                        }
                    });
                }
            });
        });
    }
    loadPrefab(path, nameOrUrl = DefaultBundle) {
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
                // 没有引用到的资源，释放掉
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
                // 没有引用到的资源，释放掉
                this.release(path, sp.SkeletonData, nameOrUrl);
                return Promise.reject(new Error("Spine is not valid"));
            }
        });
    }
    release(pathOrAsset, type, nameOrUrl = DefaultBundle) {
        if (typeof pathOrAsset === "string") {
            const bundle = assetManager.getBundle(nameOrUrl);
            const asset = bundle === null || bundle === void 0 ? void 0 : bundle.get(pathOrAsset, type);
            asset === null || asset === void 0 ? void 0 : asset.decRef();
            if ((asset === null || asset === void 0 ? void 0 : asset.refCount) === 0) {
                bundle === null || bundle === void 0 ? void 0 : bundle.release(pathOrAsset, type);
            }
        }
        else if (pathOrAsset instanceof Asset) {
            pathOrAsset.decRef();
            if (pathOrAsset.refCount === 0) {
                assetManager.releaseAsset(pathOrAsset);
            }
        }
    }
}

export { ResLoader };
