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

import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Session } from 'meteor/session';

// Import needed templates
import '../../ui/layouts/body/body.js';

import '../../ui/components/breadcrumbs';
import '../../ui/components/loading';

import '../../ui/pages/resources';
import '../../ui/pages/userprofile';
import '../../ui/pages/not-found';
import '../../ui/pages/clusters';
import '../../ui/pages/cluster';
import '../../ui/pages/welcome';
import '../../ui/pages/org';
import '../../ui/pages/razeeWelcome';

const Routes = FlowRouter.group({
    name: 'base_route',
});

Routes.route('/', {
    name: 'root',
    title: 'Welcome',
    action() {
        BlazeLayout.render('Base_layout', { main: 'Razee_welcome' });
    },
});

Routes.route('/profile', {
    name: 'profile',
    title: 'Profile',
    parent: 'welcome',
    action() {
        BlazeLayout.render('Base_layout', { main: 'UserProfile_home', dcId: null });
    },
});

// puts /:orgName/ in the url
const orgedRoutes = Routes.group({
    prefix: '/:baseOrgName',
    name: 'orgedRoute',
    triggersEnter: [
        (context) => {
            const orgName = context.params.baseOrgName;
            Session.set('currentOrgName', orgName);
        }
    ]
});

orgedRoutes.route('/', {
    name: 'welcome',
    title: 'Welcome',
    action: function() {
        BlazeLayout.render('Base_layout', { main: 'page_welcome', });
    }
});

orgedRoutes.route('/org', {
    name: 'org',
    title: ':baseOrgName',
    parent: 'welcome',
    action: function() {
        BlazeLayout.render('Base_layout', { main: 'OrgSingle', });
    }
});

orgedRoutes.route('/clusters', {
    name: 'clusters.search',
    title: 'Clusters',
    parent: 'welcome',
    action: function() {
        BlazeLayout.render('Base_layout', { main: 'page_clusters', });
    }
});

orgedRoutes.route('/clusters/:id', {
    name: 'cluster',
    title: 'Cluster :id',
    parent: 'clusters.search',
    action: function(params) {
        FlowRouter.go('cluster.tab', { id: params.id, tabId: 'resources'});
    }
});

orgedRoutes.route('/clusters/:id/:tabId', {
    name: 'cluster.tab',
    title: 'Cluster :id', // default display. updates to the cluster name via imports/ui/components/breadcrumbs
    parent: 'clusters.search',
    action: function(params) {
        if ( !params.tabId ) {
            FlowRouter.setParams( { clusterId: params.id, tabID: 'resources' });
        }
        BlazeLayout.render('Base_layout', { main: 'page_cluster_id', clusterId: params.id, tabID: params.tabId });
    }
});

orgedRoutes.route('/resources', {
    name: 'resources.search',
    title: 'Resources',
    parent: 'welcome',
    action: function() {
        BlazeLayout.render('Base_layout', { main: 'page_resources', });
    }
});

orgedRoutes.route('/resources/:resourceName/:clusterId', {
    name: 'resource.cluster',
    title: 'Resource Cluster :clusterId',
    parent: 'resources.search',
    action(params) {
        BlazeLayout.render('Base_layout', { main: 'Resources_single', resourceName: params.resourceName, clusterId: params.clusterId });
    },
});

FlowRouter.notFound = {
    action() {
        BlazeLayout.render('Base_layout', { main: 'App_notFound' });
    },
};
