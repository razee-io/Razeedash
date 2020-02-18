// Colletion to hold all user log entries

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export const UserLog = new Mongo.Collection('user_log');

UserLog.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

const userLogSchema = new SimpleSchema({
    userid: { type: String, index: true },
    action: { type: String, index: true },
    message: { type: String, required: true },
    created: { type: Date, required: true, },
});

UserLog.attachSchema(userLogSchema);