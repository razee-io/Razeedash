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
    async addLabel(orgId, name){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( name, NonEmptyString);

        logUserAction(Meteor.userId(), 'addLabel', `Add label ${orgId}:${name}`);

        let client = await getQueryClient();
        return client.mutate({
            mutation: gql`
              mutation AddLabel($orgId: String!, $name: String!) {
                addLabel(orgId: $orgId, name: $name) { 
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
    async removeLabel(orgId, labelName, uuid){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( labelName, String );
        check( uuid, String );

        logUserAction(Meteor.userId(), 'removeLabel', `Remove label ${orgId}:${labelName}:${uuid}`);

        let client = await getQueryClient();
        return client.mutate({
            mutation: gql`
            mutation RemoveLabel($orgId: String!, $uuid: String!) {
              removeLabel(orgId: $orgId, uuid: $uuid) { 
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

});
