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

        let client = await getQueryClient(orgId);
        return client.mutate({
            mutation: gql`
              mutation EditSubscription($org_id: String!, $uuid: String!, $name: String!, $tags: [String!]!, $channel_uuid: String!, $version_uuid: String!) {
                editSubscription(org_id: $org_id, uuid: $uuid, name: $name, tags: $tags, channel_uuid: $channel_uuid, version_uuid: $version_uuid) { 
                    uuid
                  }
              }
          `,
            variables: {
                'org_id': orgId,
                'uuid': groupId,
                'name': groupName,
                'tags': tags,
                'channel_uuid': resourceId,
                'version_uuid': version,
            }
        });
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

        let client = await getQueryClient(orgId);
        return client.mutate({
            mutation: gql`
              mutation AddSubscription($org_id: String!, $name: String!, $tags: [String!]!, $channel_uuid: String!, $version_uuid: String!) {
                addSubscription(org_id: $org_id, name: $name, tags: $tags, channel_uuid: $channel_uuid, version_uuid: $version_uuid) { 
                    uuid
                  }
              }
            `,
            variables: {
                'org_id': orgId,
                'name': groupName,
                'tags': tags,
                'channel_uuid': resourceId,
                'version_uuid': version,
            }
        });
    },
    async removeSubscription(orgId, groupName, uuid){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( groupName, String );
        check( uuid, String );

        logUserAction(Meteor.userId(), 'removeSubscription', `Remove subscription ${orgId}:${groupName}:${uuid}`);

        let client = await getQueryClient(orgId);
        return client.mutate({
            mutation: gql`
            mutation RemoveSubscription($org_id: String!, $uuid: String!) {
              removeSubscription(org_id: $org_id, uuid: $uuid) { 
                  uuid
                }
            }
          `,
            variables: {
                'org_id': orgId,
                'uuid': uuid
            }
        });
    },

});
