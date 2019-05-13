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
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from 'meteor/meteor';
import '../portlet';
import { Session } from 'meteor/session';

Template.sevenDayDeployments.helpers({
    recentDepsPerService: () => Template.instance().recentDepsPerService.get(),
});

Template.sevenDayDeployments.onRendered(function() {
    this.autorun(()=>{
        Meteor.call('getRecentDepsPerService', Session.get('currentOrgId'), (error, result)=>{
            this.recentDepsPerService.set(result);
        });
    });
});

Template.sevenDayDeployments.onCreated(function() {
    this.recentDepsPerService = new ReactiveVar();

    this.autorun(() => {
        this.subscribe('resources.recent', Session.get('currentOrgId'));
    });
});
