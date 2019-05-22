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

import '../../historyDropdown';
import '../../kindIcon';
import './component.scss';
import './component.html';
import { Resources } from '/imports/api/resource/resources.js';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.deployments.helpers({
    resources() {
        return Resources.find({ cluster_id: this.cluster_id }, {
            sort: { 'searchableData.namespace':1, 'searchableData.name': 1 },
        });
    },
    versionsMatch() {
        return this.version === this.advertised_version;
    },
    appRoute() {
        return FlowRouter.path('App.home');
    },
});

Template.deployments.onCreated(function() {
    this.autorun(() => {
        this.subscribe('resources.byCluster', Session.get('currentOrgId'), Template.currentData().cluster_id);
    });
});
