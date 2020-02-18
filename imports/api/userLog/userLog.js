// Colletion to hold all user log entries

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const UserLog = new Mongo.Collection('user_log');

UserLog.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

if ( Meteor.isServer ) {
    UserLog._ensureIndex( { 'userid': 1, 'action': 1} );
}
