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
import { UpdaterMessages } from '/imports/api/message/updaterMessages/updaterMessages.js';
import '../../components/portlet';
import { Session } from 'meteor/session';
import moment from 'moment';

Template.updaterMessages.helpers({
    recentUpdaterMessages: () => UpdaterMessages.find({ updated: { $gte: new moment().subtract(5, 'minutes').toDate() } }, { sort: { updated: -1 } }),
    getMessageType: (m) => {
        // let returnValue = 'success';
        let returnValue = 'info';
        if (m.search(/error/i) >= 0) {
            returnValue = 'danger';
        }
        if (m.search(/warn/i) >= 0) {
            returnValue = 'warning';
        }
        return returnValue;
    },
    getMessageHeader: (m) => {
        // let returnValue = 'success';
        let returnValue = '<i class="fa fa-info-circle"></i> Information';
        if (m.search(/error/i) >= 0) {
            returnValue = '<i class="fa fa-exclamation-circle"></i> Error';
        }
        if (m.search(/warn/i) >= 0) {
            returnValue = '<i class="fa fa-exclamation-triangle"></i> Warning';
        }
        // <i class="fa fa-check-circle"></i> Success
        return returnValue;
    },
});

Template.updaterMessages.onCreated(function() {
    this.autorun(() => {
        this.subscribe('updater_messages.past5Minutes', Session.get('currentOrgId'));
    });
});
