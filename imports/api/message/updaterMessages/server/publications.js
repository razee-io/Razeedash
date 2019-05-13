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
import { UpdaterMessages } from '../updaterMessages.js';
import { requireOrgAccess } from '/imports/api/org/utils.js';
import moment from 'moment';

Meteor.publish('updater_messages.past5Minutes', function(orgId) {
    requireOrgAccess(orgId);
    return UpdaterMessages.find({ org_id: orgId, updated: { $gte: new moment().subtract(5, 'minutes').toDate() } }, { limit: 10, sort: { updated: -1 } });
});

Meteor.publish('updater_messages.byDeployment', function(clusterId, deploymentName) {
    check( clusterId, String );
    check( deploymentName, String );
    return UpdaterMessages.find({ cluster_id: clusterId, deployment_name: deploymentName, updated: { $gte: new moment().subtract(1, 'hour').toDate() } }, { limit: 100, sort: { updated: -1 } });
});

Meteor.publish('updater_messages.byCluster', function(clusterId) {
    check( clusterId, String );
    return UpdaterMessages.find({ cluster_id: clusterId, updated: { $gte: new moment().subtract(1, 'hour').toDate() } }, { limit: 100, sort: { updated: -1 } });
});
