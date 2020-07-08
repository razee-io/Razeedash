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
    async addGroup(orgId, name){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( name, NonEmptyString);

        logUserAction(Meteor.userId(), 'addGroup', `Add group ${orgId}:${name}`);

        let client = await getQueryClient();
        return client.mutate({
            mutation: gql`
              mutation AddGroup($orgId: String!, $name: String!) {
                addGroup(orgId: $orgId, name: $name) { 
                    uuid
                  }
              }
            `,
            variables: {
                'orgId': orgId,
                'name': name,
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },
    async removeGroup(orgId, uuid){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( uuid, String );

        logUserAction(Meteor.userId(), 'removeGroup', `Remove group ${orgId}:${uuid}`);

        let client = await getQueryClient();
        return client.mutate({
            mutation: gql`
            mutation RemoveGroup($orgId: String!, $uuid: String!) {
              removeGroup(orgId: $orgId, uuid: $uuid) { 
                  uuid
                  success
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
    async groupClusters(orgId, uuid, clusters){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( uuid, String );
        check( clusters, [String]);

        logUserAction(Meteor.userId(), 'groupClusters', `Group clusters ${orgId}:${uuid}:${clusters}`);

        const client = await getQueryClient();
        return client.mutate({
            mutation: gql`
            mutation GroupClusters($orgId: String!, $uuid: String!, $clusters: [String]!) {
              groupClusters(orgId: $orgId, uuid: $uuid, clusters: $clusters) { 
                modified
              }
            }
          `,
            variables: {
                'orgId': orgId,
                'uuid': uuid,
                'clusters': clusters
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },

});
