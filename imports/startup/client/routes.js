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
import '../../ui/pages/deployables';

const Routes = FlowRouter.group({
    name: 'base_route',
});

Routes.route('/', {
    name: 'root',
    title: 'Welcome',
    action() {
        BlazeLayout.render('Base_layout', { main: 'Razee_welcome', doesntRequireOrgIdLoaded: true });
    },
});

Routes.route('/profile', {	
    name: 'profile',	
    title: 'Profile',	
    parent: 'welcome',	
    action() {	
        BlazeLayout.render('Base_layout', { main: 'UserProfile_home', doesntRequireOrgIdLoaded: true });	
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


// orgedRoutes.route('/groups', {
//     name: 'groups',
//     title: 'Groups',
//     parent: 'welcome',
//     action: function(params) {
//         // if ( !params.tabId ) {
//         //     FlowRouter.setParams( { tabId: 'channels' });
//         // }
//         BlazeLayout.render('Base_layout', { main: 'Groups' });
//     }
// });


orgedRoutes.route('/deployables', {
    name: 'deployables',
    title: 'Channels',
    parent: 'welcome',
    triggersEnter: [function() {
        const params = { 
            tabId: 'channels',
            baseOrgName: Session.get('currentOrgName'),
        };
        FlowRouter.go('deployables', params );
    }],
});

orgedRoutes.route('/deployables/:tabId/:id', {
    name: 'channel.details',
    title: 'Details',
    parent: 'deployables',
    action: function(params) {
        if ( !params.id) {
            FlowRouter.setParams( { tabId: 'channels' });
        }
        if ( !params.tabId ) {
            FlowRouter.setParams( { tabId: 'channels' });
        }
        if(params.tabId === 'groups') {
            BlazeLayout.render('Base_layout', { main: 'group_single', tabId: params.tabId, groupId: params.id });
        } else {
            BlazeLayout.render('Base_layout', { main: 'channel_single', tabId: params.tabId, channelId: params.id });
        }
    }
});


orgedRoutes.route('/deployables/:tabId/:id/versions', {
    name: 'channel.versions',
    title: 'Versions',
    parent: 'channel.details',
    action: function(params) {
        if ( !params.id) {
            FlowRouter.setParams( { tabId: 'channels' });
        }
        if ( !params.tabId ) {
            FlowRouter.setParams( { tabId: 'channels' });
        }
        BlazeLayout.render('Base_layout', { main: 'channel_versions_all', tabId: params.tabId, channelId: params.id });
    }
});


orgedRoutes.route('/deployables/:tabId/:id/versions/:versionId', {
    name: 'channel.version.details',
    title: 'Details',
    parent: 'channel.details',
    action: function(params) {
        if ( !params.id) {
            FlowRouter.setParams( { tabId: 'channels' });
        }
        if ( !params.tabId ) {
            FlowRouter.setParams( { tabId: 'channels' });
        }
        BlazeLayout.render('Base_layout', { main: 'channel_version', tabId: params.tabId, channelId: params.id, versionId: params.versionId });
    }
});

orgedRoutes.route('/deployables/:tabId', {
    name: 'deployables',
    title: ':tabId',
    parent: 'welcome',
    action: function(params) {
        if ( !params.tabId ) {
            FlowRouter.setParams( { tabId: 'channels' });
        }
        BlazeLayout.render('Base_layout', { main: 'page_deployables', tabId: params.tabId });
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

orgedRoutes.route('/resources/:clusterId', {
    name: 'resource.cluster',
    title: 'Resource Cluster :clusterId',
    parent: 'resources.search',
    action(params, queryParams) {
        BlazeLayout.render('Base_layout', { main: 'Resources_single', selfLink: queryParams.selfLink, clusterId: params.clusterId });
    },
});

orgedRoutes.route('/clusters/:clusterId/resources/resource', {
    name: 'cluster.resource',
    title: 'Resource Cluster :clusterId',
    parent: 'cluster.tab',
    action(params, queryParams) {
        BlazeLayout.render('Base_layout', { main: 'Resources_single', selfLink: queryParams.selfLink, clusterId: params.clusterId });
    },
});

FlowRouter.notFound = {
    action() {
        BlazeLayout.render('Base_layout', { main: 'App_notFound', doesntRequireOrgIdLoaded: true });
    },
};
