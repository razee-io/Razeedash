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
              mutation EditChannel($orgId: String!, $uuid: String!, $name: String!) {
                editChannel(orgId: $orgId, uuid: $uuid, name: $name) { 
                    uuid
                    name
                    success
                  }
              }
            `,
            variables: {
                'orgId': orgId,
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
              mutation AddChannel($orgId: String!, $name: String!) {
                addChannel(orgId: $orgId, name: $name) { 
                    uuid
                  }
              }
            `,
            variables: {
                'orgId': orgId,
                'name': channelName
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },
    async removeChannel(orgId, resourceId ){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( resourceId, String );
        
        logUserAction(Meteor.userId(), 'removeChannel', `Remove channel ${orgId}:${resourceId}`);

        let client = await getQueryClient();
        return client.mutate({
            mutation: gql`
            mutation RemoveChannel($orgId: String!, $uuid: String!) {
              removeChannel(orgId: $orgId, uuid: $uuid) { 
                  uuid
                  success
                }
            }
          `,
            variables: {
                'orgId': orgId,
                'uuid': resourceId
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },
    async addChannelVersion(orgId, channelUuid, name, type, content, description){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( channelUuid, String );
        check( name, String );
        check( type, String );
        check( content, String );
        check( description, String );
      
        logUserAction(Meteor.userId(), 'addChannelVersion', `Add channel version ${orgId}:${channelUuid}:${name}`);

        let client = await getQueryClient();
        return client.mutate({
            mutation: gql`
            mutation addChannelVersion($orgId: String!, $channelUuid: String!, $name: String!, $type: String!, $content: String, $description: String) {
              addChannelVersion(orgId: $orgId, channelUuid: $channelUuid, name: $name, type: $type, content: $content, description: $description) { 
                  versionUuid
                  success
              }
            }
        `,
            variables: {
                'orgId': orgId,
                'channelUuid': channelUuid,
                'name': name,
                'type': type,
                'content': content,
                'description': description
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });

    },
    async getChannelVersion(orgId, channelUuid, versionUuid){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( channelUuid, String );
        check( versionUuid, String );
    
        logUserAction(Meteor.userId(), 'getChannelVersion', `Get channel version ${orgId}:${channelUuid}:${versionUuid}`);

        let client = await getQueryClient();
        return client.query({
            query: gql`
              query getChannelVersion($orgId: String!, $channelUuid: String!, $versionUuid: String!) {
                getChannelVersion(orgId: $orgId, channelUuid: $channelUuid, versionUuid: $versionUuid) { 
                    type
                    content
                }
              }
            `,
            variables: {
                'orgId': orgId,
                'channelUuid': channelUuid,
                'versionUuid': versionUuid
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },
});
