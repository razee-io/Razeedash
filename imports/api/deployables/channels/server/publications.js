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
import { Channels } from '../channels';
import { requireOrgAccess } from '/imports/api/org/utils.js';
import { DeployableVersions } from '../deployableVersions';

Meteor.publish('channels', function(orgId) {
    check( orgId, String );
    requireOrgAccess(orgId);
    return Channels.find({ org_id: orgId });
});

Meteor.publish('deployableVersions', function(orgId) {
    check( orgId, String );
    requireOrgAccess(orgId);
    return DeployableVersions.find({ org_id: orgId });
});
