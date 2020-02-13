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
import { Match } from 'meteor/check';
import { Resources } from '../resources.js';
import utils from '/imports/both/utils.js';
import { requireOrgAccess } from '/imports/api/org/utils.js';

Meteor.publish('resources.byCluster', function(orgId, clusterId) {
    check( clusterId, String );
    return Resources.find({ 
        cluster_id: clusterId,
        org_id: orgId,
        deleted: false
    });
});

Meteor.publish('resources.recent', function(orgId) {
    check( orgId, String );
    requireOrgAccess(orgId);
    return Resources.find({ org_id: orgId },{ sort: { updated: -1 }, limit: 10 });
});

Meteor.publish('resources.bySelfLink', function(orgId, clusterId, selfLink) {
    check( orgId, String );
    check( clusterId, String );
    check( selfLink, String );
    requireOrgAccess(orgId);

    var search = {
        selfLink,
        cluster_id: clusterId,
    };
    var options = {
        fields: {
            cluster_id: 1,
            org_id: 1,
            selfLink: 1,
            created: 1,
            updated: 1,
            searchableData: 1,
            searchableDataHist: 1,
        },
        limit: 25,
        sort: { 'created': -1 }
    };
    return Resources.find(search, options);
});

Meteor.publish('resourceData.bySelfLink', function(orgId, clusterId, selfLink) {
    check( orgId, String );
    check( clusterId, Match.Maybe( String ));
    check( selfLink, String );

    requireOrgAccess(orgId);

    var search = {
        selfLink,
        cluster_id: clusterId,
    };
    var options = {
        fields: {
            data: 1,
        },
        limit: 25,
        sort: { 'created': -1 }
    };
    return Resources.find(search, options);
});

Meteor.publish('resourcesSearch', function(orgId, searchStr='', limit=50, fromTime, toTime) {
    requireOrgAccess(orgId);
    check( orgId, String );
    check( searchStr, String );
    check( limit, Match.Maybe(Number) );
    check( fromTime, Match.Maybe(Number) );
    check( toTime, Match.Maybe(Number) );
    limit = limit || 50;
    var options = {
        limit: limit,
        fields: {
            cluster_id: 1,
            org_id: 1,
            selfLink: 1,
            created: 1,
            updated: 1,
            searchableData: 1,
            deleted: 1
        }
    };
    let search = {org_id: orgId, deleted: false };
    if (searchStr || fromTime || toTime) {
        search = utils.buildSearchForResourcesName(orgId, searchStr, fromTime, toTime, true);
        if (!search) {
            return [];
        }
    } 
    return Resources.find(search, options);
});
