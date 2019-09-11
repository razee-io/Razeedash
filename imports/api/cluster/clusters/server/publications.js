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
import { Clusters } from '../clusters.js';
import { Match } from 'meteor/check';
import utils from '/imports/both/utils.js';
import { requireOrgAccess } from '/imports/api/org/utils.js';
import moment from 'moment';

Meteor.publish('clusters.zombie', function(orgId) {
    requireOrgAccess(orgId);
    return Clusters.find({
        org_id: orgId,
        updated: { $lt: new moment().subtract(1, 'day').toDate() }
    }, {
        sort: { updated: 1 },
        fields: {
            org_id: 1,
            'cluster_id': 1,
            'cluster_name': 1,
            'metadata.name': 1,
            'cluster_lock': 1,
            'updated': 1,
        },
        limit: 10,
    });
});

Meteor.publish('clusters.org', function(orgId) {
    check( orgId, String );
    requireOrgAccess(orgId);
    return Clusters.find({ org_id: orgId });
});

Meteor.publish('clusters.id', function(orgId, clusterId) {
    check( orgId, String );
    check( clusterId, String );
    requireOrgAccess(orgId);
    return Clusters.find({ org_id: orgId, cluster_id: clusterId });
});

Meteor.publish('clusterSearch', function(orgId, searchStr, limit=50) {
    requireOrgAccess(orgId);
    check( orgId, String );
    check( searchStr, String );
    check( limit, Match.Maybe(Number) );
    limit = limit || 50;
    var options = {
        sort: [
            ['cluster_name', 1]
        ],
        fields: {
            org_id: 1,
            cluster_id: 1,
            updated: 1,
            'metadata.name': 1,
            'metadata.cluster_lock': 1,
            'metadata.kube_version': 1
        },
        limit: limit,
    };
    if (!searchStr) {
        return Clusters.find({org_id: orgId}, {...options, sort: {created: -1}});
    }
    var search = utils.buildSearchForClusterName(orgId, searchStr);
    return Clusters.find(search, options);
});
