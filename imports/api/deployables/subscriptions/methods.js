/**
 * Copyright 2019 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Subscriptions } from './subscriptions.js';
import { requireOrgAccess } from '/imports/api/org/utils.js';
import uuid from 'uuid/v4';
import { pub } from '/imports/api/lib/pubsub';
import { logUserAction } from '../../userLog/utils.js';

// https://docs.meteor.com/api/check.html
const NonEmptyString = Match.Where((x) => {
    check(x, String);
    return x.length > 0;
});

Meteor.methods({
    async updateSubscription(orgId, groupId, groupName, tags=[], resourceId='', resourceName='', version='', versionName=''){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( groupId, String );
        check( groupName, NonEmptyString);
        check( tags, Array );
        check( resourceId, String );
        check( resourceName, String );
        check( version, String);
        check( versionName, String);

        logUserAction(Meteor.userId(), 'updateSubscription', `Update subscription ${orgId}:${groupId}:${groupName}:${tags}:${resourceId}:${resourceName}:${version}:${versionName}`);

        Subscriptions.update(
            {
                'org_id': orgId,
                uuid: groupId
            },
            {
                $set:
                    {
                        'name': groupName,
                        'tags': tags,
                        'channel_uuid': resourceId,
                        'channel': resourceName,
                        'version': versionName,
                        'version_uuid': version,
                        'updated': new Date()
                    }
            }
        );

        var msg = {
            orgId,
            groupName,
            subscription: await Subscriptions.findOne({ 'org_id': orgId, uuid: groupId }),
        };
        pub('updateSubscription', msg);

        return true;
    },
    async addSubscription(orgId, groupName, tags=[], resourceId='', resourceName='', version='', versionName='' ){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( groupName, NonEmptyString);
        check( tags, Array );
        check( resourceId, String );
        check( resourceName, String );
        check( version, String);
        check( versionName, String);

        logUserAction(Meteor.userId(), 'addSubscription', `Add subscription ${orgId}:${groupName}:${tags}:${resourceId}:${resourceName}:${version}:${versionName}`);

        Subscriptions.insert({
            'org_id': orgId,
            'name': groupName,
            'uuid': uuid(),
            'tags': tags,
            'channel_uuid': resourceId,
            'channel': resourceName,
            'version': versionName,
            'version_uuid': version,
            'owner': Meteor.userId(),
            'created': new Date()
        });

        var msg = {
            orgId,
            groupName,
        };
        pub('addSubscription', msg);

        return true;
    },
    async removeSubscription(orgId, groupName){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( groupName, String );

        logUserAction(Meteor.userId(), 'removeSubscription', `Remove subscription ${orgId}:${groupName}`);

        Subscriptions.remove({ 'org_id': orgId, 'name': groupName });

        var msg = {
            orgId,
            groupName,
        };
        pub('removeSubscription', msg);

        return true;
    },

});
