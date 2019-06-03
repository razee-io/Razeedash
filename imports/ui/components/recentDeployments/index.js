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

import './component.html';
import { Template } from 'meteor/templating';
import { Resources } from '/imports/api/resource/resources.js';
import '../portlet';
import '../kindIcon';
import { Session } from 'meteor/session';

Template.recentDeployments.helpers({
    recentDeployments: () => Resources.find({}, { sort: { 'updated': -1 }, limit: 10 }),
    hasRecentDeployments: () => {
        const deploymentCount = Resources.find({}, { sort: { 'updated': -1 }, limit: 10 }).count();
        return (deploymentCount > 0) ? true: false;
    }
});

Template.recentDeployments.onCreated(function() {
    this.autorun(() => {
        this.subscribe('resources.recent', Session.get('currentOrgId'));
    });
});

Template.recentDeployments_row.onCreated(function() {
    this.autorun(() => {
        this.subscribe('clusters.id', Session.get('currentOrgId'), this.data.deployment.cluster_id);
    });
});
