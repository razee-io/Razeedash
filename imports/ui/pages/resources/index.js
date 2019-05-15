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

/* eslint-env jquery */

import './page.html';
import './page.scss';
import '../../components/kindIcon';
import '/node_modules/bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css';
import ResourcesSingle from './resourcesSingle';

// eslint-disable-next-line
import datepicker from 'bootstrap-datepicker';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Blaze } from 'meteor/blaze';
import _ from 'lodash';
import moment from 'moment';
import debounce from 'debounce';
import { Resources } from '/imports/api/resource/resources.js';
import { Clusters } from '/imports/api/cluster/clusters/clusters.js';
import utils from '/imports/both/utils';

var displayLimit = new ReactiveVar(25); // how many items the user can see
var displayLimitIncrement = 25; // how many more items the user can see after clicking the 'more' btn
var displaySortDir = new ReactiveVar(1); // 1 (asc) or -1 (desc)

var showDatepickers = new ReactiveVar(false);

var getStoredQ = ()=>{
    return Session.get('resourcesSearch_q') || '';
};
var setStoredQ = (val)=>{
    return Session.set('resourcesSearch_q', val);
};

const setDateInUrl = (attr, date)=>{
    var val = null;
    if(date){
        date.setHours(0,0,0,0); //sets to midnight
        if(attr == 'to'){
            date.setHours(23, 59, 59);
        }
        val = date.valueOf();
    }
    val = val || null;
    FlowRouter.withReplaceState(function() {
        FlowRouter.setQueryParams({ [attr]: val || null });
    });
};

Template.page_resources.onRendered(function() {
    var fromTime = parseInt(FlowRouter.getQueryParam('from')) || 0;
    var toTime = parseInt(FlowRouter.getQueryParam('to')) || 0;
    var fromVal = '';
    var toVal = '';

    if(fromTime){
        fromVal = moment(fromTime).format('MM/DD/YYYY');
    }
    if(toTime){
        toVal = moment(toTime).format('MM/DD/YYYY');
    }

    var $from = this.$('#datepicker-from');
    var $to = this.$('#datepicker-to');

    $from.find('input').val(fromVal);
    $to.find('input').val(toVal);

    $from.datepicker({
        autoclose: true,
        container: '#datepickersContainer',
    });
    $to.datepicker({
        autoclose: true,
        container: '#datepickersContainer',
        useCurrent: false,
    });
    showDatepickers.set(fromTime || toTime);

    this.find('input').focus();
});

const debounceSubscription = debounce( ( instance, fromTime, toTime )=> {
    instance.subscribe('resourcesSearch', Session.get('currentOrgId'), getStoredQ(), displayLimit.get(), fromTime, toTime);
}, 500);

Template.page_resources.onCreated(function() {
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
        var fromTime = parseInt(FlowRouter.getQueryParam('from')) || 0;
        var toTime = parseInt(FlowRouter.getQueryParam('to')) || 0;

        displaySortDir.set(parseInt(FlowRouter.getQueryParam('sortDir')) || 1);

        debounceSubscription( this, fromTime, toTime );
    });
});

Template.page_resources.helpers({
    foundResources() {
        var searchStr = getStoredQ();
        var fromTime = parseInt(FlowRouter.getQueryParam('from')) || 0;
        var toTime = parseInt(FlowRouter.getQueryParam('to')) || 0;
        var search = { org_id: Session.get('currentOrgId') };
        if(searchStr || fromTime || toTime) {
            search = utils.buildSearchForResourcesName(Session.get('currentOrgId'), searchStr, fromTime, toTime);
        }

        let sort = {};
        var sortDir = displaySortDir.get();
        const sortColumn = FlowRouter.getQueryParam('sort');
        if ( sortColumn === 'name' ) {
            sort = { 'searchableData.name': sortDir };
        }
        else if ( sortColumn === 'cluster_name' ) {
            sort = { 'searchableData.cluster_name': sortDir, 'cluster_id': sortDir };
        }
        else if ( sortColumn === 'namespace' ) {
            sort = { 'searchableData.namespace': sortDir };
        }

        var options = {
            sort: sort
        };
        return Resources.find(search, options);
    },
    foundResourcesCount(){
        var deps = Template.page_resources.__helpers.get('foundResources').call(Template.instance());
        if(!deps || (_.isArray(deps) && deps.length < 1)){
            return 0;
        }
        return deps.count();
    },
    hasSearch(){
        var fromTime = parseInt(FlowRouter.getQueryParam('from')) || 0;
        var toTime = parseInt(FlowRouter.getQueryParam('to')) || 0;
        return (getStoredQ() || fromTime || toTime);
    },
    hasResults(){
        var count = Template.page_resources.__helpers.get('foundResourcesCount').call(Template.instance());
        return (count > 0);
    },
    datepickerItemsClass(reverse){
        var show = showDatepickers.get();
        if(reverse){
            show = !show;
        }
        if(show){
            return 'show';
        }
        return '';
    },
    datepickerItemsClassShowHide(reverse){
        var show = showDatepickers.get();
        if(reverse){
            show = !show;
        }
        if(show){
            return '';
        }
        return 'd-none';
    },
    getSearchStr() {
        return getStoredQ();
    },
    hitDisplayLimit() {
        var currentCount = Template.page_resources.__helpers.get('foundResourcesCount').call(Template.instance());
        return (currentCount >= displayLimit.get());
    },
    sortDirFAClassName(){
        return (displaySortDir.get() == 1 ? 'fa-sort-alpha-asc' : 'fa-sort-alpha-desc');
    },
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

Template.page_resources.events({
    'keyup #resourcesSearchInput' (event) {
        var val = $(event.target).val();
        FlowRouter.withReplaceState(function() {
            FlowRouter.setQueryParams({ q: val || null });
            setStoredQ(val);
        });
    },
    'click .resourceListMoreBtn' () {
        var newLimit = displayLimit.get() + displayLimitIncrement;
        FlowRouter.withReplaceState(function() {
            FlowRouter.setQueryParams({ limit: newLimit || null });
        });
        return false;
    },
    'click #calendar-open-btn' (){
        showDatepickers.set(true);
        return false;
    },
    'click #calendar-close-btn' (){
        $('#datepicker-from').data().datepicker.clearDates();
        $('#datepicker-to').data().datepicker.clearDates();
        setDateInUrl('to', null);
        setDateInUrl('from', null);
        showDatepickers.set(false);
        return false;
    },
    'changeDate #datepicker-from'(event){
        setDateInUrl('from', event.date);
    },
    'changeDate #datepicker-to'(event){
        setDateInUrl('to', event.date);
    },
    'change #datepicker-from' (event){ // handles if they delete the date from the input
        var val = $(event.target).val();
        if(val == ''){
            setDateInUrl('from', null);
        }
    },
    'change #datepicker-to' (event){
        var val = $(event.target).val();
        if(val == ''){
            setDateInUrl('to', null);
        }
    },
    'click .sortable-header' (event) {
        setSort(event.currentTarget.dataset.column || null);
    },
});

Template.page_resources_resource.helpers({
    filterResourceForDates(resource){
    // filters the resource to only have `image_history` items that fall between fromTime and toTime
        resource = _.cloneDeep(resource);
        var fromTime = parseInt(FlowRouter.getQueryParam('from')) || 0;
        var toTime = parseInt(FlowRouter.getQueryParam('to')) || 0;
        resource.image_history = _.filter(resource.image_history, (item)=>{
            if(fromTime && (new Date(item.created)).valueOf() < fromTime){
                return false;
            }
            if(toTime && (new Date(item.created)).valueOf() > toTime){
                return false;
            }
            return true;
        });
        return resource;
    },
    filteredHistory(resource){
        resource = Template.page_resources_resource.__helpers.get('filterResourceForDates').call(Template.instance(), resource);
        return Blaze._globalHelpers.imageHistory(resource);
    },
    filteredLastUpdated(resource){
        resource = Template.page_resources_resource.__helpers.get('filterResourceForDates').call(Template.instance(), resource);
        return Blaze._globalHelpers.lastUpdated(resource);
    }
});

Template.page_resource_id.onCreated(function() {
    this.autorun(() => {
        var clusterId = FlowRouter.getParam('id');
        this.subscribe('clusters.id', clusterId);
    });
});

Template.page_resource_id.helpers({
    getCluster() {
        return Resources.findOne({ resource_id: Template.currentData().resourceId });
    },
});

var decryptStr = (encrypted, token)=>{
    var success = false;
    var str;
    try{
        str = utils.tokenCrypt.decrypt(encrypted, token);
        success = true;
    }catch(e){
        success = false;
    }

    var out = { success, str, };
    return out;
};

var localOrgKeySave = {
    keyName: 'savedOrgKeys',
    getFullObj:()=>{
        var obj = JSON.parse(localStorage.getItem(localOrgKeySave.keyName)||'{}')||{};
        return obj;
    },
    set:(name, val)=>{
        var obj = localOrgKeySave.getFullObj();
        obj[name]=val;
        localStorage.setItem(localOrgKeySave.keyName, JSON.stringify(obj));
    },
    get:(name)=>{
        var obj = localOrgKeySave.getFullObj();
        return obj[name];
    },
};

var decryptionKey = new ReactiveVar('');
var resourceDataJson = new ReactiveVar(null);

Template.Resources_single.onRendered(function() {
    this.autorun(()=>{
        var clusterId = Template.instance().getClusterId();
        var resourceName = Template.instance().getResourceName();
        var resource = Resources.findOne({ cluster_id: clusterId, 'searchableData.name': resourceName} );
        if(!resource){
            return;
        }
        Meteor.call('getResourceData', clusterId, resource.selfLink, (err, data)=>{
            resourceDataJson.set(err || data);
        });
    });
});

Template.Resources_single.onCreated(function() {
    this.getResourceName = () => FlowRouter.getParam('resourceName');
    this.getClusterId = () => FlowRouter.getParam('clusterId');
    this.autorun(() => {
        this.subscribe('resources.byName', this.getResourceName(), this.getClusterId());
        this.subscribe('clusters.id', this.getClusterId());
    });
});

Template.Resources_single.helpers({
    resource(){
        return Resources.findOne({});
    },
    templateData(){
        var resource = Template.Resources_single.__helpers.get('resource').call(Template.instance());
        var resourceData = null;
        if(resource){
            resourceData = decryptStr(resource.data, decryptionKey.get());
        }
        return { resource, resourceData };
    },
    decideTemplate(){
        return 'Resources_single_default';
    },
    clusterName(){
        var clusterId = Template.instance().getClusterId();
        return _.get(Clusters.findOne({ cluster_id: clusterId }), 'cluster_name', clusterId);
    },
    ResourcesSingle(){
        return ResourcesSingle;
    },
});
Template.Resources_single.events({
    'keyup .decryptionKey': (e)=>{
        var $el = $(e.target).closest('.decryptionKey');
        var val = $el.val();
        decryptionKey.set(val);
        var orgName = Meteor.settings.public.DEFAULT_ORG;
        localOrgKeySave.set(orgName, val);
    }
});

var showDecryptionKey = new ReactiveVar(false);
Template.Resources_single_default.helpers({
    decryptionKey(){
        return decryptionKey.get();
    },
    showDecryptionKey(){
        return showDecryptionKey.get();
    },
    decryptionKeyInputType(){
        return (showDecryptionKey.get() ? 'input' : 'password');
    },
    showDecryptionKeyBtnText(){
        return (showDecryptionKey.get() ? 'Hide' : 'Show');
    },
});
Template.Resources_single_default.onRendered(function(){
    var orgName = Meteor.settings.public.DEFAULT_ORG;
    var savedDecryptionKey = localOrgKeySave.get(orgName);
    $('.decryptionKey').val(savedDecryptionKey);
    decryptionKey.set(savedDecryptionKey);
});
Template.Resources_single_default.events({
    'click .showDecryptionKeyBtn':()=>{
        showDecryptionKey.set(!showDecryptionKey.get());
        return false;
    },
});

Template.Resources_single_dump_searchable_attrs.helpers({
    searchableDataAsArr(){
        return _.filter(_.map(Template.currentData().resource.searchableData||{}, (val, key)=>{
            if(_.isNull(val)){
                return null;
            }
            return { key, val };
        }));
    },
    formatVal(key, val){
        if(_.isNumber(val)){
            if(_.isInteger(val) && key.match(/time/i)){
                return `${moment(val < 3000000000 ? val * 1000: val ).format('LLL')} (int ${val})`;
            }
            return val;
        }
        if(_.isObject(val)){
            return val;
        }
        return val;
    }
});
