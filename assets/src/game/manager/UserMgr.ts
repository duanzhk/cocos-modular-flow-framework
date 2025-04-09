import { starmaker } from "../../framework/core/Core";

const { managedWithClean, getInterface } = starmaker.core;

@managedWithClean()
class UserMgr extends starmaker.core.AbstractManager {
    initialize(): void {
    }

    testUser(): void {
        console.log("UserMgr.testUser");
    }

}

export const IUserMgr = getInterface(UserMgr)