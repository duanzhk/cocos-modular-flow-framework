import { AbstractManager, getInterface, managedWithClean } from "@core";


@managedWithClean()
class UserMgr extends AbstractManager {
    initialize(): void {
    }

    testUser(): void {
        console.log("UserMgr.testUser");
    }

    testUser2(): void {
        console.log("UserMgr.testUser");
    }

}

export const IUserMgr = getInterface(UserMgr)