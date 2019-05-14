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

// Import client startup through a single index entry point
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import moment from 'moment';
import _ from 'lodash';
import utils from '/imports/both/utils';
import './popper';
import './main.html';
import './toastr';
import { Orgs } from '/imports/api/org/orgs';
import { Session } from 'meteor/session';

const time = new ReactiveVar();
time.set(new Date());
Meteor.setInterval(function() {
    time.set(new Date());
}, 10000);

export let hasOrgsDefined = new ReactiveVar(true);

Template.registerHelper('hasOrgsDefined', () => {
    return hasOrgsDefined.get();
});

// updates pathFor() helper to auto-put the orgName
var oldPathFor = Blaze._globalHelpers.pathFor;
Template.deregisterHelper('pathFor');
Template.registerHelper('pathFor', (path, view={hash:{}})=>{
    // if not explicitly setting it in this call, uses the current value
    if(!_.get(view, 'hash.baseOrgName')){
        _.set(view, 'hash.baseOrgName', Session.get('currentOrgName'));
    }
    return oldPathFor(path, view);
});

Template.registerHelper('meteorSetting', (name)=>{
    return _.get(Meteor.settings.public, name, null);
});

Template.registerHelper('githubUrl', ()=>{
    return Meteor.settings.public.GITHUB_URL;
});

Template.registerHelper('currentGheOrgName', ()=>{
    return Session.get('currentOrgName');
});

Template.registerHelper('currentGheOrgId', ()=>{
    if(!Session.get('currentOrgName')){
        return null;
    }
    var org = Orgs.findOne({ name: Session.get('currentOrgName') });
    return _.get(org, 'gheOrgId', null);
});

Template.registerHelper('gheOrgIdLoaded', ()=>{
    if(!Session.get('currentOrgName')){
        return false;
    }
    var org = Orgs.findOne({ name: Session.get('currentOrgName') });
    var gheOrgId = _.get(org, 'gheOrgId', null);
    return !!gheOrgId;
});

Template.registerHelper( 'withinMinutes', (datetime, minutes) => {
    if( !datetime ) {
        return false;
    }
    const minutesAgo = moment().subtract( minutes, 'minutes');
    return moment(datetime).isAfter( minutesAgo );
});

Template.registerHelper('moment', (datetime) => {
    if (!datetime || datetime === '--' || datetime === '') return '';
    if(moment(datetime).isAfter(time.get())){
        datetime = time.get();
    }
    return moment(datetime).from(time.get());
});

Template.registerHelper('momentHumanize', (datetime) => {
    if (!datetime || datetime === '--' || datetime === '') return '--';
    return moment.duration(datetime).humanize();
});

Template.registerHelper('testStatusBg', (status) => {
    if (status && status.trim() === 'pass' ) return 'text-success';
    if (status && status.trim() === 'fail' ) return 'text-danger';

    return '';
});

Template.registerHelper('localeDate', (datetime) => {
    if (!datetime || datetime === '--' || datetime === '') return '';
    return datetime.toLocaleString();
});

Template.registerHelper('equals', (val1, val2) => {
    return val1 == val2;
});

Template.registerHelper('emptyAsDash', (value) => {
    if (!value || value === '') return '--';
    return value;
});

Template.registerHelper('trimCommit', (commit) => {
    if (commit.length == 40) {
        return commit.substring(0, 7);
    } else {
        return commit;
    }
});

Template.registerHelper('isCommit', (commit) => {
    return commit.length == 40;
});

Template.registerHelper('getTag', (image) => {
    if (!image) { return '--'; }

    const tag = image.split(':')[1];
    if (!tag) { return 'latest'; }

    return tag;
});

Template.registerHelper('getImage', (image) => {
    if (!image) { return '--'; }

    return image.split(':')[0];
});

Template.registerHelper('getShortImage', (image) => {
    if (!image) { return '--'; }

    image = image.split(':')[0];
    return image.slice(image.lastIndexOf('/') + 1);
});

Template.registerHelper('stringify', (obj) => {
    return JSON.stringify(obj);
});
Template.registerHelper('getProp', (obj, propName, defaultVal='') => {
    return _.get(obj, propName, defaultVal);
});
Template.registerHelper('or', (a,b) => {
    return a || b;
});

Template.registerHelper('capitalize', (str)=>{
    return _.capitalize(str);
});

Template.registerHelper('jsonparse', (str) => {
    var obj;
    try{
        obj = JSON.parse(str);
    }catch(e){
        obj = str;
    }
    return obj;
});
Template.registerHelper('default', (arg1, arg2='unknown', arg3='unknown', arg4='unknown')=>{
    return arg1 || arg2 || arg3 || arg4;
});
Template.registerHelper('outputDisabled', (disabled) => {
    return (disabled ? 'disabled' : '');
});
Template.registerHelper('outputDisabledFlipped', (disabled) => {
    return (disabled ? '' : 'disabled');
});

Template.registerHelper('commitHref', (commitId, deployment=null)=>{
    const githubOrgName = Session.get('currentOrgName');
    const githubProjName = deployment.searchableData.name;
    return `${Meteor.settings.public.GITHUB_URL}${githubOrgName}/${githubProjName}/commit/${commitId}`;
});

Template.registerHelper('valuesJoined', (values) => {
    if (values.length == 1) {
        return `"${values[0]}"`;
    }
    return '(' + values.map((a) => { return `"${a}"`; }).join(', ') + ')';
});

Template.registerHelper('join', (values, delimiter=', ') => {
    return values.map( value => value.trim() ).join(delimiter);
});

Template.registerHelper('lastUpdated', (deployment) => {
    return deployment.updated;
});

Template.registerHelper('imageHistory', (deployment) => {
    if (!deployment || !deployment.image_history) {
        return [];
    }
    var history = deployment.image_history;
    if (history.length > 10) {
        history = history.slice(history.length - 10);
    }
    return history.slice().reverse();
});

Template.registerHelper('sortedBy', (columnName) => {
    return FlowRouter.getQueryParam('sort') === columnName;
});

Template.registerHelper('boldifySearchMatches', (searchStr, str) => {
    str = Blaze._escape(str || '');
    searchStr = Blaze._escape(searchStr);
    searchStr = _.trim(searchStr);
    if (!searchStr || searchStr.length < 1) {
        return str;
    }
    var searchRegex = '(' + _.map(searchStr.split(/\s+/), (token) => {
        return utils.sanitizeRegexStr(token);
    }).join('|') + ')';
    searchRegex = new RegExp(searchRegex, 'gi');
    str = str.replace(searchRegex, (matchStr) => {
        return `<b>${matchStr}</b>`;
    });
    return str;
});


Template.registerHelper('iconForOrgName', (orgName) => {
    var orgs = _.get(Meteor.user(), 'profile.orgs', []);
    var selectedOrg = _.find(orgs, (org)=>{
        return (_.get(org, 'name') == orgName);
    });
    var url = _.get(selectedOrg, 'avatarUrl');
    if(url){
        return url;
    }
    orgs = _.get(Meteor.user(), 'profile.orgNames', []);
    selectedOrg = _.find(orgs, (org)=>{
        return (_.get(org, 'login') == orgName);
    });
    return _.get(selectedOrg, 'avatar_url');
});

Template.stringifyp.helpers({
    formatData(data) {
        return JSON.stringify(data, null, 4);
    },
});

Template.registerHelper('getVersion', (propName) => {
    const versionInfo = Meteor.settings.public.version;
    return versionInfo[propName];
});

Template.registerHelper('generateQueryString', (qsValue) => {
    return `q=${qsValue}`;
});

Template.registerHelper('getClusterName', (cluster) => {
    let clusterName = cluster.cluster_id;
    if(cluster.metadata && cluster.metadata.name) {
        clusterName = cluster.metadata.name;
    }
    return clusterName;
});

import './routes.js';
