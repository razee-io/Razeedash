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

import './page.scss';
import './page.html';
import '../../components/cluster/details';
import '../../components/cluster/resources';
import '../../components/cluster/updaterMessages';
import '../../components/cluster/webhooks';
import '../../components/cluster/comments';
import moment from 'moment';
import { Messages } from '/imports/api/message/messages.js';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.cluster.helpers({
    collapsable() {
        return !Template.currentData().notCollapsable;
    },
    updaterMessagesByClusterId(clusterId) {
        return Messages.find({
            cluster_id: clusterId,
            updated: { $gte: new moment().subtract(1, 'hour').toDate() }
        }, { sort: { updated: -1 } });
    },
    hasUpdaterMessages(clusterId) {
        return Messages.find({
            cluster_id: clusterId,
            updated: { $gte: new moment().subtract(1, 'hour').toDate() }
        }).count() > 0;
    },
    updaterMessagesByClusterIdCountStr(clusterId) {
        var count = Messages.find({ cluster_id: clusterId }).count();
        if (count > 99) {
            // stops at 99 because we have a limit 100 on the publisher
            count = '99+';
        }
        return count || '0';
    },
    commentCountStr() {
        return (this.cluster.comments || []).length;
    },
    hasComments() {
        return ((this.cluster.comments || []).length > 0);
    },
    isActiveTab(tabId) {
        if ( FlowRouter.getParam('tabId') === tabId ) {
            return 'active';
        }
        return false;
    }
});

Template.cluster.onCreated(function() {
    this.autorun(() => {
        const clusterId = Template.currentData().cluster.cluster_id;
        this.subscribe('messages.byCluster', clusterId);
    });
});
