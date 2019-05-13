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

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'lodash';
import { FlowRouter } from 'meteor/kadira:flow-router';

import '../../components/clustersByKubeVersion';
import '../../components/activeDeployments';
import '../../components/updaterMessages';
import '../../components/sevenDayDeployments';
import '../../components/recentDeployments';
import '../../components/inactiveClusters';
import '../../components/portlet';
import './page.html';
import './page.scss';

import { Orgs } from '/imports/api/org/orgs';
import { Meteor } from 'meteor/meteor';

var hasOrgAccess = new ReactiveVar(false);
import { Session } from 'meteor/session';

Template.page_welcome.onCreated(function() {
    this.autorun(()=>{
        this.subscribe('orgsForUser');
    });

    this.autorun(()=>{
        var orgName = Session.get('currentOrgName');
        var userOrgs = _.get(Meteor.user(), 'profile.orgs', []);
        var userOrgNames = _.map(userOrgs, 'name');
        hasOrgAccess.set(_.includes(userOrgNames, orgName));
    });

    this.clusterCount = new ReactiveVar();
    this.deploymentCount = new ReactiveVar();
    this.autorun(() => {
        this.subscribe('stats', Session.get('currentOrgId'));

        // if has access, sets the user's currentOrgName attr
        if(hasOrgAccess.get()){
            Meteor.call('setAsCurrentOrgName', Session.get('currentOrgName'));
        }
    });
});

Template.page_welcome.helpers({
    hasOrgAccess(){
        return hasOrgAccess.get();
    }
});


Template.page_select_org.onRendered(function(){
    var currentOrgName = _.get(Meteor.user(), 'profile.currentOrgName', '');
    var orgNamesToSwitchTo = Template.page_select_org.__helpers.get('orgNamesToSwitchTo').call(Template.instance());
    if(currentOrgName && _.includes(orgNamesToSwitchTo, currentOrgName)){
        FlowRouter.go('welcome', { baseOrgName: currentOrgName });
    }
});

Template.page_select_org.helpers({
    userOrgByName(orgName){
        var userOrgs = Template.page_select_org.__helpers.get('userOrgs').call(Template.instance());
        var userOrg = _.find(userOrgs, (a)=>{ return a.name == orgName; });
        return userOrg;
    },
    userOrgs(){
        return _.get(Meteor.user(), 'profile.orgs', []);
    },
    managedOrgs(){
        return Orgs.find({}).fetch();
    },
    doesntHaveAnyOperationalOrgs(){
        var orgNamesToSwitchTo = Template.page_select_org.__helpers.get('orgNamesToSwitchTo').call(Template.instance());
        var orgNamesToManage = Template.page_select_org.__helpers.get('orgNamesToManage').call(Template.instance());
        return (orgNamesToSwitchTo < 1 && orgNamesToManage.length < 1);
    },
    orgNamesToSwitchTo(){
        var userOrgs = Template.page_select_org.__helpers.get('userOrgs').call(Template.instance());
        var userOrgNames = _.map(userOrgs, 'name');
        var managedOrgs = Template.page_select_org.__helpers.get('managedOrgs').call(Template.instance());
        var managedOrgNames = _.map(managedOrgs, 'name');
        return _.intersection(userOrgNames, managedOrgNames);
    },
    orgNamesToManage(){
        var userOrgs = Template.page_select_org.__helpers.get('userOrgs').call(Template.instance());
        var userAdminOrgs = _.filter(userOrgs, (orgData)=>{
            return orgData.role == 'admin';
        });
        var userAdminOrgNames = _.map(userAdminOrgs, 'name');
        var managedOrgs = Template.page_select_org.__helpers.get('managedOrgs').call(Template.instance());
        var managedOrgNames = _.map(managedOrgs, 'name');
        return _.without(userAdminOrgNames, ...managedOrgNames);
    },
});

Template.page_select_org.events({
    'click .registerOrgBtn': function(e){
        var $el = $(e.currentTarget).closest('.registerOrgBtn');
        var orgName = $el.attr('orgname');
        Meteor.call('registerOrg', orgName, (err)=>{
            if(err){
                throw err;
            }
        });
        return false;
    },
});
