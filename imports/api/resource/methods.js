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

import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Orgs } from '../org/orgs.js';
import { Resources } from './resources.js';
import { tokenCrypt } from '/imports/both/utils.js';
import { requireOrgAccess } from '/imports/api/org/utils.js';
import moment from 'moment';
import _ from 'lodash';

Meteor.methods({
    getResourceData(clusterId, resourceName){
        check( clusterId, String );
        check( resourceName, String );
        var resource = Resources.findOne({ cluster_id: clusterId, selfLink: resourceName });
        if(!resource){
            return null;
        }
        var org = Orgs.findOne({ _id: resource.org_id });
        if(!org){
            throw new Meteor.Error(`couldnt find org id "${resource.org_id}" from resource._id "${resource._id}"`);
        }
        return tokenCrypt.decrypt(resource.data, org.orgKeys[0]);
    },
    async getActiveDepsPerService(orgId){
        requireOrgAccess(orgId);
        var out = await Resources.rawCollection().aggregate( [
            { $match: { org_id: orgId, 'updated': { $gte: new moment().subtract(1, 'day').toDate() }}},
            { $group: { _id: { namespace: '$searchableData.namespace', name: '$searchableData.name' }, count: { $sum: 1 } }  },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ] ).toArray();
        out = _.map(out, (item)=>{
            // blazejs gets mad at us if we use a non-ObjectId for `_id`, so we'll pass `id` back instead
            item.id = item._id;
            delete item._id;
            return item;
        });
        return out;
    },
    async getRecentDepsPerService(orgId){
        requireOrgAccess(orgId);
        var out = await Resources.rawCollection().aggregate([
            { $match: { org_id: orgId, 'updated': { $gt: new moment().subtract(170, 'days').toDate() } } },
            { $group: {
                _id: {
                    namespace: '$searchableData.namespace',
                    name: '$searchableData.name'
                },
                deployments: { $sum: 1 }
            }},
            { $sort: { 'deployments': -1 } },
            { $limit: 10 } ]).toArray();

        out = _.map(out, (item)=>{
            // blazejs gets mad at us if we use a non-ObjectId for `_id`, so we'll pass `id` back instead
            item.id = item._id;
            delete item._id;
            return item;
        });
        return out;
    },
    pruneClusterResources(orgId, clusterId){
        check(orgId, String)
        check(clusterId, String);
        requireOrgAccess(orgId);
        Resources.remove({ cluster_id: clusterId});
    }
});
