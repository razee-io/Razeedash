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
import { requireOrgAccess } from '/imports/api/org/utils.js';
import { logUserAction } from '../../userLog/utils.js';

const { getQueryClient } = require('/imports/api/lib/graphql.js');
const gql = require('graphql-tag');

// https://docs.meteor.com/api/check.html
const NonEmptyString = Match.Where((x) => {
    check(x, String);
    return x.length > 0;
});

Meteor.methods({
    async updateChannel(orgId, appId, channelName){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( appId, String );
        check( channelName, String );

        logUserAction(Meteor.userId(), 'updateChannel', `Update channel ${orgId}:${appId}:${channelName}`);

        let client = await getQueryClient();
        return await client.mutate({
            mutation: gql`
              mutation EditChannel($org_id: String!, $uuid: String!, $name: String!) {
                editChannel(org_id: $org_id, uuid: $uuid, name: $name) { 
                    uuid
                    name
                    success
                  }
              }
            `,
            variables: {
                'org_id': orgId,
                'uuid': appId,
                'name': channelName
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },
    async addChannel(orgId, channelName ){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( channelName, NonEmptyString);

        logUserAction(Meteor.userId(), 'addChannel', `Add channel ${orgId}:${channelName}`);

        let client = await getQueryClient();
        return client.mutate({
            mutation: gql`
              mutation AddChannel($org_id: String!, $name: String!) {
                addChannel(org_id: $org_id, name: $name) { 
                    uuid
                  }
              }
            `,
            variables: {
                'org_id': orgId,
                'name': channelName
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },
    async removeChannel(orgId, channelName, resourceId ){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( channelName, String );
        check( resourceId, String );
        
        logUserAction(Meteor.userId(), 'removeChannel', `Remove channel ${orgId}:${channelName}:${resourceId}`);

        let client = await getQueryClient();
        return client.mutate({
            mutation: gql`
            mutation RemoveChannel($org_id: String!, $uuid: String!) {
              removeChannel(org_id: $org_id, uuid: $uuid) { 
                  uuid
                  success
                }
            }
          `,
            variables: {
                'org_id': orgId,
                'uuid': resourceId
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },

});
