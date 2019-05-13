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
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Import needed templates
import '../../ui/layouts/body/body.js';

import '../../ui/components/breadcrumbs';
import '../../ui/components/loading';

import '../../ui/pages/resources';
import '../../ui/pages/login';
import '../../ui/pages/userprofile';
import '../../ui/pages/not-found';
import '../../ui/pages/clusters';
import '../../ui/pages/cluster';
import '../../ui/pages/welcome';
import '../../ui/pages/org';
import '../../ui/pages/admin/adminHome';
import '../../ui/pages/admin/adminOrgs';

import { Tracker } from 'meteor/tracker';

let hasRedirectedFirstLoad = false;

// Set up all routes in the app
FlowRouter.route('/login', {
    name: 'Login',
    title: 'Login',
    action() {
        hasRedirectedFirstLoad = false;
        BlazeLayout.render('Login');
    },
});

const Routes = FlowRouter.group({
    name: 'base_route',
    triggersEnter: [
        () => {
            if (!Meteor.userId()) {
                FlowRouter.go('Login');
            }
        }
    ]
});

Routes.route('/', {
    name: 'root',
    title: 'Welcome',
    parent: 'base_route',
    action() {
        // When a user first logs on to razeedash they are brought to localhost:3000/ . If the
        // user reloads the browser at this point we need to add in the org name so it will be
        // something like localhost:3000/my-org . Tracker is used here b/c Meteor.user() 
        // is not immediately available when the routing file is loaded.
        Tracker.autorun( function() {
            var user = Meteor.user();
            if(!user) {
                return;
            }
            if(hasRedirectedFirstLoad) {
                return;
            }
            hasRedirectedFirstLoad = true;
            Session.set('currentOrgName', user.profile.orgs[0].name);
            FlowRouter.go('welcome', { baseOrgName: Session.get('currentOrgName') });
        });
    },
});

// without this, someone that bookmarks the /orgs or /profile routes will see an infinite spinner icon
const checkForOrg = function() {
    if(!Session.get('currentOrgName')) {
        FlowRouter.go('/');
    }
};
Routes.route('/profile', {
    name: 'profile',
    title: 'Profile',
    parent: 'welcome',
    triggersEnter: [checkForOrg],
    action() {
        BlazeLayout.render('App_body', { main: 'UserProfile_home', dcId: null });
    },
});
Routes.route('/orgs', {
    name: 'orgs',
    title: 'Orgs',
    parent: 'welcome',
    triggersEnter: [checkForOrg],
    action() {
        BlazeLayout.render('App_body', { main: 'UserProfile_orgs', });
    },
});

const adminRoutes = Routes.group({
    prefix: '/admin',
    name: 'admin',
});
adminRoutes.route('/', {
    name: 'admin.home',
    title: 'Admin',
    action: function() {
        BlazeLayout.render('AppAdminPage', { main: 'AdminHome', });
    },
});
adminRoutes.route('/orgs', {
    name: 'admin.orgs',
    title: 'Orgs',
    parent: 'admin.home',
    action: function() {
        BlazeLayout.render('AppAdminPage', { main: 'AdminOrgsHome', });
    },
});
adminRoutes.route('/orgs/register', {
    name: 'admin.org.register',
    title: 'Register',
    parent: 'admin.orgs',
    action: function() {
        BlazeLayout.render('AppAdminPage', { main: 'AdminOrgRegister', });
    },
});
adminRoutes.route('/orgs/:orgName', {
    name: 'admin.org',
    title: ':orgName',
    parent: 'admin.orgs',
    action: function(params) {
        BlazeLayout.render('AppAdminPage', { main: 'AdminOrgsSingle', orgName: params.orgName, });
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
        BlazeLayout.render('App_body', { main: 'page_welcome', });
    }
});

orgedRoutes.route('/org', {
    name: 'org',
    title: ':baseOrgName',
    parent: 'orgs',
    action: function() {
        BlazeLayout.render('App_body', { main: 'OrgSingle', });
    }
});

orgedRoutes.route('/clusters', {
    name: 'clusters.search',
    title: 'Clusters',
    parent: 'welcome',
    action: function() {
        BlazeLayout.render('App_body', { main: 'page_clusters', });
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
        BlazeLayout.render('App_body', { main: 'page_cluster_id', clusterId: params.id, tabID: params.tabId });
    }
});

orgedRoutes.route('/resources', {
    name: 'resources.search',
    title: 'Resources',
    parent: 'welcome',
    action: function() {
        BlazeLayout.render('App_body', { main: 'page_resources', });
    }
});

orgedRoutes.route('/resources/:resourceName/:clusterId', {
    name: 'resource.cluster',
    title: 'Resource Cluster :clusterId',
    parent: 'resources.search',
    action(params) {
        BlazeLayout.render('App_body', { main: 'Resources_single', resourceName: params.resourceName, clusterId: params.clusterId });
    },
});

FlowRouter.notFound = {
    action() {
        BlazeLayout.render('App_body', { main: 'App_notFound' });
    },
};
