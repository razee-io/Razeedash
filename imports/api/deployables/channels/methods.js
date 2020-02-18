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
import { Channels } from './channels';
import { DeployableVersions } from './deployableVersions';
import { requireOrgAccess } from '/imports/api/org/utils.js';
import { updateDeployablesCountStat } from '../../stat/utils.js';
import { logUserAction } from '../../userLog/utils.js';

import uuid from 'uuid/v4';

// https://docs.meteor.com/api/check.html
const NonEmptyString = Match.Where((x) => {
    check(x, String);
    return x.length > 0;
});

Meteor.methods({
    updateChannel(orgId, appId, channelName){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( appId, String );
        check( channelName, String );

        logUserAction(Meteor.userId(), 'updateChannel', `Update channel ${orgId}:${appId}:${channelName}`);

        Channels.update(
            { 
                'org_id': orgId,
                uuid: appId
            }, 
            { 
                $set: 
                { 
                    'name': channelName,
                    'updated': new Date() 
                } 
            });
        return true;
    },
    addChannel(orgId, channelName ){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( channelName, NonEmptyString);

        logUserAction(Meteor.userId(), 'addChannel', `Add channel ${orgId}:${channelName}`);

        Channels.insert({
            'org_id': orgId,
            'name': channelName,
            'uuid': uuid(),
            'created': new Date(),
            'versions': [],
        });
        updateDeployablesCountStat(orgId);
        return true;
    },
    removeChannel(orgId, channelName, resourceId ){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( channelName, String );
        check( resourceId, String );
        
        logUserAction(Meteor.userId(), 'removeChannel', `Remove channel ${orgId}:${channelName}:${resourceId}`);

        Channels.remove({ 'org_id': orgId, 'name': channelName });
        DeployableVersions.remove({ 'org_id': orgId, 'channel_id': resourceId});
        updateDeployablesCountStat(orgId);
        return true;
    },

});
