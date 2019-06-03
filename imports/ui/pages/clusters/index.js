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

import './page.html';
import './page.scss';

import _ from 'lodash';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';
import debounce from 'debounce';

import { Clusters } from '/imports/api/cluster/clusters/clusters.js';

import utils from '/imports/both/utils';

var displayLimit = new ReactiveVar(25); // how many items the user can see
var displayLimitIncrement = 25; // how many more items the user can see after clicking the 'more' btn
var displaySortDir = new ReactiveVar(1); // 1 (asc) or -1 (desc)

var getStoredQ = ()=>{
    return Session.get('clustersSearch_q') || '';
};
var setStoredQ = (val)=>{
    return Session.set('clustersSearch_q', val);
};

const debounceSubscription = debounce( ( instance )=> {
    instance.subscribe('clusterSearch', Session.get('currentOrgId'), getStoredQ(), displayLimit.get());
}, 500);

Template.page_clusters.onCreated(function() {
    this.autorun(() => {
        var urlQ = FlowRouter.getQueryParam('q') || '';
        var urlLimit = parseInt(FlowRouter.getQueryParam('limit') || 0);

        if (urlQ && getStoredQ != urlQ) {
            setStoredQ(urlQ);
        }

        if (urlLimit && displayLimit.get() != urlLimit) {
            displayLimit.set(urlLimit);
            return;
        }

        displaySortDir.set(parseInt(FlowRouter.getQueryParam('sortDir')) || 1);

        debounceSubscription( this );
    });
});

Template.page_clusters.onRendered(function() {
    this.find('input').focus();
});

Template.page_clusters.helpers({
    foundClusters() {
        var searchStr = getStoredQ();
        var search = utils.buildSearchForClusterName(Session.get('currentOrgId'), searchStr);
        let sort = {};
        var sortDir = displaySortDir.get();
        const sortColumn = FlowRouter.getQueryParam('sort');
        if ( sortColumn === 'cluster_name' ) {
            sort = { 'metadata.name': sortDir };
        }
        else if ( sortColumn === 'kube_version' ) {
            sort = { 'metadata.kube_version': sortDir, 'metadata.name': 1 };
        }
        else if ( sortColumn === 'cluster_id' ) {
            sort = { cluster_id: sortDir };
        }

        if(!search){
            sort = { created: -1 };
        }

        var options = {
            sort: sort
        };
        return Clusters.find(search, options);
    },
    hasResults(){
        var count = Template.page_clusters.__helpers.get('foundClusters').call(Template.instance()).count();
        return (count > 0);
    },
    getSearchStr() {
        return getStoredQ();
    },
    hitDisplayLimit() {
        var currentCount = Template.page_clusters.__helpers.get('foundClusters').call(Template.instance()).count();
        return (currentCount >= displayLimit.get());
    },
    sortDirFAClassName(){
        return (displaySortDir.get() == 1 ? 'fa-sort-alpha-asc' : 'fa-sort-alpha-desc');
    }
});

Template.page_clusters_cluster.helpers( {
    getClusterVersion(cluster) {
        let version;
        if( _.has(cluster, 'metadata.kube_version.gitVersion') ) {
            version = cluster.metadata.kube_version.gitVersion;
        } else if( _.has(cluster, 'metadata.kube_version.major') && _.has(cluster, 'metadata.kube_version.minor') ){
            version = cluster.metadata.kube_version.major + '.' + cluster.metadata.kube_version.minor;
        } else {
            version = 'unknown';
        }
        return version;
    }
});

var setSort = (name)=>{
    var curSort = FlowRouter.getQueryParam('sort');
    var curSortDir = FlowRouter.getQueryParam('sortDir');
    var sortDir = null;
    if(curSort == name && !curSortDir){
        // if already set as this sort, then swaps it to desc
        sortDir = -1;
    }
    FlowRouter.withReplaceState(function() {
        FlowRouter.setQueryParams({
            sort: name,
            sortDir,
        });
    });
};

Template.page_clusters.events({
    'keyup #clusterSearchInput' (event) {
        var val = $(event.target).val();
        FlowRouter.withReplaceState(function() {
            FlowRouter.setQueryParams({ q: val || null });
            setStoredQ(val);
        });
    },
    'click .clusterListMoreBtn' () {
        var newLimit = displayLimit.get() + displayLimitIncrement;
        FlowRouter.withReplaceState(function() {
            FlowRouter.setQueryParams({ limit: newLimit || null });
        });
        return false;
    },
    'click .sortable-header' (event) {
        setSort(event.currentTarget.dataset.column || null);
    }
});

Template.page_cluster_id.onCreated(function() {
    this.autorun(() => {
        this.subscribe('clusters.id', Session.get('currentOrgId'), FlowRouter.getParam('id'));
    });
});

Template.page_cluster_id.helpers({
    getCluster() {
        return Clusters.findOne({ cluster_id: FlowRouter.getParam('id') });
    },
});
