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

import './body.scss';
import './nav.html';
import './body.html';
import './footer.html';
import '../../pages/login';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';
import _ from 'lodash';
import { Template } from 'meteor/templating';
import { Stats } from '/imports/api/stat/stats.js';
import { Orgs } from '/imports/api/org/orgs';
import { Breadcrumb } from 'meteor/ahref:flow-router-breadcrumb';

import { hasOrgsDefined } from '../../../startup/client';

Template.App_body.helpers({
    versionsMatch() {
        return this.version === this.advertised_version;
    },
    appRoute() {
        return FlowRouter.path('App.home');
    },
    baseOrg(){
        var orgName = Session.get('currentOrgName');
        var val = Orgs.findOne({ name: orgName });
        if(!orgName || !val){
            return null;
        }
        Session.set('currentOrgId', val._id);
        return val;
    }
});

Template.App_body.onRendered(function() {
    this.autorun(()=>{
        this.subscribe('userData');
        var orgName = Session.get('currentOrgName');
        this.subscribe('orgIdByName', orgName);
        Meteor.call('hasOrgs', function(err, result) {
            hasOrgsDefined.set(result);
        });
    });
});

Template.nav.helpers({
    appRoute() {
        return FlowRouter.path('App.home');
    },
    isActive(routeName) {
        let breadcrumbs = Breadcrumb.getAll();
        var routeTree = _.map(breadcrumbs, 'routeName'); // arr of routeNames for this route and its parent routes
        if (_.includes(routeTree, routeName)) {
            return 'active';
        }
        return '';
    },
    navItemQueryStr(page) {
        var qs = '';
        if (page === 'clusters') {
            var clustersSearch_q = Session.get('clustersSearch_q');
            if (clustersSearch_q) {
                qs = `q=${clustersSearch_q}`;
            }
        }
        return qs;
    },
    clusterCount: () => (_.get(Stats.findOne({org_id:Session.get('currentOrgId')}), 'clusterCount') || 0).toLocaleString(),
    deploymentCount: () => (_.get(Stats.findOne({org_id:Session.get('currentOrgId')}), 'deploymentCount') || 0).toLocaleString()
});

Template.nav.events({
    'click .razee-login' () {
        Meteor.logout();
    },
    'click a' () {
        $('.navbar-collapse').collapse('hide');
    }
});

Template.nav.onCreated(function() {
    this.autorun(() => {
        Meteor.call('reloadUserOrgList');
        this.subscribe('orgsForUser');

        if(Session.get('currentOrgName')) {
            hasOrgsDefined.set(true);
        } else {
            hasOrgsDefined.set(false);
        }
        if(Session.get('currentOrgId')) {
            this.subscribe('resourceStats', Session.get('currentOrgId'));
        }
        this.subscribe('userData');
    });
});

Template.nav_org_dropdown.onCreated(function(){
    this.autorun(()=>{
        this.subscribe('orgsForUser');
    });
});

Template.nav_org_dropdown.helpers({
    selectedOrgName(){
        return Session.get('currentOrgName');
    },
    isSelected(orgName){
        var selectedOrgName = Session.get('currentOrgName');
        return (selectedOrgName == orgName ? 'selected' : '');
    },
});
