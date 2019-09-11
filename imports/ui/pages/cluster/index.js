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
import '../../components/cluster/webhooks';
import '../../components/cluster/comments';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.cluster.helpers({
    collapsable() {
        return !Template.currentData().notCollapsable;
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
