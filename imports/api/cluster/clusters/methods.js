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

import _ from 'lodash';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Clusters } from './clusters.js';
import moment from 'moment';
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
    addWebhookToCluster(cluster_id, url){
        check( cluster_id, String );
        check( url, String );
        var webhook = { id: Random.id(), url, created: new Date() };
        Clusters.update(
            { cluster_id },
            { $addToSet: { webhooks: webhook } }
        );
    },
    removeWebhookFromCluster(cluster_id, webhookId){
        check( cluster_id, String );
        check( webhookId, String );
        Clusters.update(
            { cluster_id },
            { $pull: { webhooks: { id: webhookId } } }
        );
    },
    createClusterComment(clusterId, content) {
        check( clusterId, String );
        check( content, String );
        const userId = Meteor.userId();
        Clusters.update({ cluster_id: clusterId }, {
            $push: {
                comments: {
                    user_id: userId,
                    content: content,
                    created: new Date(),
                }
            }
            //note: doesnt change the cluster.updated time, because thats the time cluster_updater last changed our info
        });
        return true;
    },
    async getClusterCountByKubeVersion(orgId){
        requireOrgAccess(orgId);
        var out = await Clusters.rawCollection().aggregate( [
            { $match: { org_id: orgId, 'updated': { $gte: new moment().subtract(1, 'day').toDate() }}},
            { $group: { _id: { version: '$metadata.kube_version' }, count: { $sum: 1 } }  },
            { $sort: { _id: -1 } },
        ] ).toArray();
        out = _.map(out, (item)=>{
            // blazejs gets mad at us if we use a non-ObjectId for `_id`, so we'll pass `id` back instead
            item.id = item._id;
            delete item._id;
            return item;
        });
        return out;
    },
    requestClusterResync(orgId, clusterId){
        check( orgId, String );
        check( clusterId, String );
        requireOrgAccess(orgId);

        var search = {
            org_id: orgId,
            cluster_id: clusterId,
        };
        var sets = {
            dirty: true,
        };
        Clusters.update(search, { $set: sets });
    },
    pruneCluster(orgId, clusterId){
        check(orgId, String);
        check(clusterId, String);
        requireOrgAccess(orgId);

        Clusters.remove({ cluster_id: clusterId });
    },
    async registerCluster(orgId, clusterName ){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( clusterName, NonEmptyString);

        logUserAction(Meteor.userId(), 'registerCluster', `Register cluster ${orgId}:${clusterName}`);

        const client = await getQueryClient();
        return client.mutate({
            mutation: gql`
              mutation RegisterCluster($orgId: String!, $registration: JSON!) {
                registerCluster(orgId: $orgId, registration: $registration) { 
                    url
                  }
              }
            `,
            variables: {
                'orgId': orgId,
                'registration': { 'name': clusterName }
            }
        }).catch( (err) => {
            throw new Meteor.Error(err.message);
        });
    },
});
