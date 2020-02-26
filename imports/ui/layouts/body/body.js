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
import '../../components/addCluster';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker'; 
import _ from 'lodash';
import { Template } from 'meteor/templating';
import { Stats } from '/imports/api/stat/stats.js';
import { Breadcrumb } from 'meteor/ahref:flow-router-breadcrumb';

import { hasOrgsDefined } from '../../../startup/client';
import { Blaze } from 'meteor/blaze';

let currentRoute = new ReactiveVar(true);

Template.Base_layout.helpers({
    versionsMatch() {
        return this.version === this.advertised_version;
    },
    appRoute() {
        return FlowRouter.pathFor('App.home');
    }
});

Template.Base_layout.onRendered(function() {
    this.autorun(()=>{
        this.subscribe('userData');
        var orgName = Session.get('currentOrgName');
        this.subscribe('orgIdByName', orgName);

        Meteor.call('hasOrgs', function(err, result) {
            hasOrgsDefined.set(result);
        });
    });
});

Template.Base_layout.helpers({
    loadedOrgIdIfRequired(){
        // add `doesntRequireOrgIdLoaded: true` to the route to make it not require loading the org id
        var doesntRequireOrgIdLoaded = !!((Template.currentData().doesntRequireOrgIdLoaded || (()=>{return false;}))());
        if(doesntRequireOrgIdLoaded){
            return true;
        }
        return Blaze._globalHelpers.orgIdFound();
    },
    hasInvalidOrgWhenRequired(){
        var subHasLoaded = Template.Base_layout.__helpers.get('orgIdSubHasLoaded').call(Template.instance());
        var loadedOrgIdIfRequired = Template.Base_layout.__helpers.get('loadedOrgIdIfRequired').call(Template.instance());
        if(subHasLoaded && !loadedOrgIdIfRequired){
            return true;
        }
        return false;
    },
    orgIdSubHasLoaded(){
        return Template.instance().subscriptionsReady();
    },
    currentOrgName(){
        return Session.get('currentOrgName');
    },
});

Template.nav.helpers({
    appRoute() {
        return FlowRouter.pathFor('App.home');
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
    showNavItems() {
        if(currentRoute.get() === 'root') {
            return false;
        } else {
            return true;
        }
    },
    showCounters() {
        if(Session.get('currentOrgName') && Session.get('currentOrgId')) {
            return true;
        } else {
            return false;
        }
    },
    clusterCount: () => (_.get(Stats.findOne({org_id:Session.get('currentOrgId')}), 'clusterCount') || 0).toLocaleString(),
    deploymentCount: () => (_.get(Stats.findOne({org_id:Session.get('currentOrgId')}), 'deploymentCount') || 0).toLocaleString(),
});

Template.nav.events({
    'click .razee-logout' () {
        Meteor.logout( () => {
            FlowRouter.go('/');
        });
    },
    'click a' () {
        $('.navbar-collapse').collapse('hide');
    },
    'click .navbar' () {
        $('#js-settingsDropdown').popover('dispose');
    },
    'click .js-add-cluster'(e){
        e.preventDefault();
        var $modal = $('.js-add-cluster-modal');
        $modal.modal('show');
        return false;
    }
});

Template.nav.onRendered(function() {
    let statsSubscription = this.subscribe('resourceStats', Session.get('currentOrgId'));
    Tracker.autorun(()=> {
        if(statsSubscription.ready()) {
            const numberOfClusters =  (_.get(Stats.findOne({org_id:Session.get('currentOrgId')}), 'clusterCount') || 0).toLocaleString();
            if(numberOfClusters === '0') {
                const options = {
                    container: '.js-settings',
                    placement: 'bottom',
                    trigger: 'focus'
                };
                $('#js-settingsDropdown').popover(options);
                $('#js-settingsDropdown').popover('show');
            } else {
                $('#js-settingsDropdown').popover('dispose');
            }
        }
    });
});

Template.nav.onCreated(function() {
    this.autorun(() => {
        Meteor.call('reloadUserOrgList');

        if(Session.get('currentOrgName')) {
            hasOrgsDefined.set(true);
        } else {
            hasOrgsDefined.set(false);
        }
        if(Session.get('currentOrgId')) {
            Meteor.call('updateResourceStats', Session.get('currentOrgId'));
        }
        this.subscribe('userData');
    });
    Tracker.autorun(function() {
        currentRoute.set(FlowRouter.getRouteName());
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
