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
import { ResourceYamlHist } from './resourceYamlHist.js';
import { requireOrgAccess } from '/imports/api/org/utils.js';
import moment from 'moment';
import _ from 'lodash';

Meteor.methods({
    async getPrevResourceYamlHistObj(orgId, clusterId, resourceSelfLink){
        check(orgId, String);
        check(clusterId, String);
        check(resourceSelfLink, String);
        requireOrgAccess(orgId);
        var search = {
            org_id: orgId,
            cluster_id: clusterId,
            resourceSelfLink,
        };
        var options = {
            sort: {
                updated: -1,
            },
            limit: 1,
            skip: 1,
        };
        return await ResourceYamlHist.findOne(search, options);
    },
    async getTwoYamlHistsAtTimestamp(orgId, clusterId, resourceSelfLink, ts=null){
        check(orgId, String);
        check(clusterId, String);
        check(resourceSelfLink, String);
        check(ts, Match.Maybe(Number));
        requireOrgAccess(orgId);

        var search = {
            org_id: orgId,
            cluster_id: clusterId,
            resourceSelfLink,
        };
        if(ts){
            search.updated = { $lte: new Date(ts) };
        }
        console.log(3333, search)
        var options = {
            sort: {
                updated: -1,
            },
            limit: 2,
        };
        return await ResourceYamlHist.find(search, options).fetch();
    }
});
