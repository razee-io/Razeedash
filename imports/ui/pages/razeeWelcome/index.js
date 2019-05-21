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

import './page.scss';
import './page.html';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Orgs } from '/imports/api/org/orgs';
import _ from 'lodash';

var refreshStatus = new ReactiveVar('');

Template.SelectOrg.onCreated(function(){
    this.autorun(()=>{
        this.subscribe('orgsForUser');
    });
    $(function() {
        $('[data-toggle="tooltip"]').tooltip();
    });
});

Template.SelectOrg.helpers({
    refreshStatus(){
        return refreshStatus.get();
    },
    orgNames(){
        return _.get(Meteor.user(), 'github.orgs', []).sort((a,b)=>a.name.toLowerCase().localeCompare(b.name.toLowerCase())) || [];
    },
    orgExists(name){
        return !!Orgs.findOne({ name });
    },
    isAdminOfOrg(name){
        var orgs = _.get(Meteor.user(), 'github.orgs', []);
        var org = _.find(orgs, (org)=>{
            return org.name === name;
        });
        return (org.role === 'admin');
    },
    authMoreOrgsLink(){
        var githubLoginService = Accounts.loginServiceConfiguration.findOne({service:'github'})
        var clientId = _.get(githubLoginService, 'clientId', '');
        return `https://github.com/settings/connections/applications/${clientId}`;
    },
});

Template.SelectOrg.events({
    'click .refresh-btn'(){
        refreshStatus.set('fa-spin');
        Meteor.call('reloadUserOrgList', ()=>{
            refreshStatus.set('');
        });
    },
});

Template.SelectOrg_register.onCreated(function(){
    this.isRegistering = new ReactiveVar(false);
});

Template.SelectOrg_register.helpers({
    isRegistering(){
        return Template.instance().isRegistering.get();
    },
});

Template.SelectOrg_register.events({
    'click .registerOrgBtn'(){
        var inst = Template.instance();
        var orgName = Template.currentData().org.name;

        inst.isRegistering.set(true);
        Meteor.call('registerOrg', orgName, (err)=>{
            inst.isRegistering.set(false);
            if(err){
                throw err;
            }
        });
        return false;
    },
   
});

Template.SelectOrg_deregister.onCreated(function(){
    this.isDeRegistering = new ReactiveVar(false);
});

Template.SelectOrg_deregister.helpers({
    isDeRegistering(){
        return Template.instance().isDeRegistering.get();
    },
});
Template.SelectOrg_deregister.events({
    'click .deRegisterOrgBtn'(){
        const inst = Template.instance();
        const orgName = Template.currentData().org.name;

        inst.isDeRegistering.set(true);
        Meteor.call('deRegisterOrg', orgName, (err)=>{
            if(err){
                throw err;
            }
        });
        return false;
    }
});
