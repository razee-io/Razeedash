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
    async updateSubscription(orgId, subscriptionId, subscriptionName, groups=[], channelId='', version=''){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( subscriptionId, String );
        check( subscriptionName, NonEmptyString);
        check( groups, Array );
        check( channelId, String );
        check( version, String);

        logUserAction(Meteor.userId(), 'updateSubscription', `Update subscription ${orgId}:${subscriptionId}:${subscriptionName}:${groups}:${channelId}:${version}`);

        const client = await getQueryClient();
        return client.mutate({
            mutation: gql`
              mutation EditSubscription($orgId: String!, $uuid: String!, $name: String!, $groups: [String!]!, $channelUuid: String!, $versionUuid: String!) {
                editSubscription(orgId: $orgId, uuid: $uuid, name: $name, groups: $groups, channelUuid: $channelUuid, versionUuid: $versionUuid) { 
                    uuid
                  }
              }
          `,
            variables: {
                'orgId': orgId,
                'uuid': subscriptionId,
                'name': subscriptionName,
                'groups': groups,
                'channelUuid': channelId,
                'versionUuid': version,
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },
    async addSubscription(orgId, subscriptionName, groups=[], channelId='', version=''){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( subscriptionName, NonEmptyString);
        check( groups, Array );
        check( channelId, String );
        check( version, String);

        logUserAction(Meteor.userId(), 'addSubscription', `Add subscription ${orgId}:${subscriptionName}:${groups}:${channelId}:${version}`);

        const client = await getQueryClient();
        return client.mutate({
            mutation: gql`
              mutation AddSubscription($orgId: String!, $name: String!, $groups: [String!]!, $channelUuid: String!, $versionUuid: String!) {
                addSubscription(orgId: $orgId, name: $name, groups: $groups, channelUuid: $channelUuid, versionUuid: $versionUuid) { 
                    uuid
                  }
              }
            `,
            variables: {
                'orgId': orgId,
                'name': subscriptionName,
                'groups': groups,
                'channelUuid': channelId,
                'versionUuid': version,
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },
    async removeSubscription(orgId, subscriptionName, uuid){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( subscriptionName, String );
        check( uuid, String );

        logUserAction(Meteor.userId(), 'removeSubscription', `Remove subscription ${orgId}:${subscriptionName}:${uuid}`);

        const client = await getQueryClient();
        return client.mutate({
            mutation: gql`
            mutation RemoveSubscription($orgId: String!, $uuid: String!) {
              removeSubscription(orgId: $orgId, uuid: $uuid) { 
                  uuid
                }
            }
          `,
            variables: {
                'orgId': orgId,
                'uuid': uuid
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },

});
