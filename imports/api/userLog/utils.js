import { UserLog } from './userLog.js';

const logUserAction = function(userid, action, message) {
    UserLog.insert({ userid: userid, action: action, message: message, created: new Date() });
};

export { logUserAction };