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

import './breadcrumbs.html';
import './breadcrumbs.scss';
import { Clusters } from '/imports/api/cluster/clusters/clusters';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Breadcrumb } from 'meteor/ahref:flow-router-breadcrumb';
import toastr from 'toastr';

import _ from 'lodash';

Template.breadcrumbs.onCreated(function(){
    this.autorun(()=>{
        var breadcrumbs = Template.breadcrumbs.__helpers.get('getBreadcrumbs').call();
        _.each(breadcrumbs, (crumb)=>{
            if(_.includes(['cluster'], crumb.routeName)){
                // if theres a crumb to go to a single cluster page, then subscribes so it can find() it
                var id = crumb.params.id || crumb.params.clusterId;
                this.subscribe('clusters.id', Session.get('currentOrgId'), id);
            }
        });
        setTitleToLastCrumb(breadcrumbs);
    });
});

var setTitleToLastCrumb = (crumbs)=>{
    var crumb = _.last(crumbs);
    var title = '';
    if(crumb){
        title = Template.breadcrumbs.__helpers.get('getDisplayName').call(Template.instance(), crumb);
        if(crumb.routeName === 'resource.cluster') {
            title = `Resource ${title}`;
        } else if(crumb.routeName === 'cluster.tab') {
            title = `Cluster ${title}`;
        }
    }
    document.title = `Razeedash${title? ` - ${title}` : ''}`;
};

Template.breadcrumbs.helpers({
    getBreadcrumbs(){
        let breadcrumbs = [];
        const ignoredCrumbs = ['welcome', 'org', 'root'];
        try {
            breadcrumbs = Breadcrumb.getAll();
        }catch(e){
            toastr.error('failed to load breadcrumbs', e);
        }
        // removes ignoredCrumbs items from the breadcrumbs list
        breadcrumbs = _.filter(breadcrumbs, (crumb)=>{
            return !(ignoredCrumbs.includes(crumb.routeName));
        });
        return breadcrumbs;
    },
    hasBreadcrumbs(){
        var crumbs = Template.breadcrumbs.__helpers.get('getBreadcrumbs').call(this);
        return (crumbs.length > 0);
    },
    getDisplayName(crumb){
        if(crumb.routeName === 'resource.cluster') {
            var name = '';
            try{
                name = crumb.route._queryParams.get('selfLink');
                name = _.last(_.filter(name.split('/')));
            }catch(e){} // eslint-disable-line no-empty
            return name;
        }
        if(crumb.routeName === 'cluster.resource') {
            let displayName = '';
            try{
                displayName = crumb.route._queryParams.get('selfLink');
                displayName = _.last(_.filter(displayName.split('/')));
            }catch(e){} // eslint-disable-line no-empty
            return displayName;
        }
        if(_.includes(['cluster.tab'], crumb.routeName)){
            // if a crumb for the single cluster page, then find()s it so we can display its name
            var id = crumb.params.id || crumb.params.clusterId;
            const cluster = Clusters.findOne({ cluster_id: id});
            if(cluster){
                return cluster.metadata.name || id;
            } else {
                return id;
            }
        } 
        return crumb.title;
    },
    getUrl(crumb){
        var qs = {};
        if(crumb.routeName == 'clusters.search'){
            var clustersSearch_q = Session.get('clustersSearch_q');
            if(clustersSearch_q){
                qs.q = clustersSearch_q;
            }
        }
        if(crumb.routeName == 'cluster.tab') {
            const clusterId = FlowRouter.current().params.clusterId || FlowRouter.current().params.id;
            const tabID = FlowRouter.current().params.tabId || 'resources';
            const params = {
                'id': clusterId,
                'tabId': tabID
            };
            return FlowRouter.path(crumb.route.name, params);
        }
        if(crumb.routeName == 'cluster.resource') {
            let displayLink = '';
            try{
                displayLink = crumb.route._queryParams.get('selfLink');
            }catch(e){} // eslint-disable-line no-empty
            qs.selfLink = displayLink;
        }
        if(crumb.routeName == 'resource.cluster'){
            var selfLink = '';
            try{
                selfLink = crumb.route._queryParams.get('selfLink');
            }catch(e){} // eslint-disable-line no-empty
            qs.selfLink = selfLink;
        }
        return FlowRouter.path(crumb.route.name, FlowRouter.current().params, qs);
    },
});
