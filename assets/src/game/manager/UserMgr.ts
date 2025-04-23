import { AbstractManager, getInterface, managedWithClean } from "../../framework/core";


@managedWithClean()
class UserMgr extends AbstractManager {
    initialize(): void {
    }

    testUser(): void {
        console.log("UserMgr.testUser");
    }

}

export const IUserMgr = getInterface(UserMgr)