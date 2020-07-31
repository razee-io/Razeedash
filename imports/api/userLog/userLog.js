// Colletion to hold all user log entries

import { Mongo } from 'meteor/mongo';

export const UserLog = new Mongo.Collection('user_log');

UserLog.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});
