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
import { Accounts } from 'meteor/accounts-base';
import { Orgs } from '/imports/api/org/orgs';
import { localUser, loginType } from '/imports/api/lib/login.js';
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
    hasOrgs(orgCount) {
        return (orgCount > 0); 
    },
    refreshStatus(){
        return refreshStatus.get();
    },
    orgNames(){
        if(localUser()) {
            const localOrgs = Orgs.find({ type: 'local' }, { name: 1 }).fetch().sort((a,b)=>a.name.toLowerCase().localeCompare(b.name.toLowerCase())) || [];
            return localOrgs;
        } else {
            return _.get(Meteor.user(), 'orgs', []).sort((a,b)=>a.name.toLowerCase().localeCompare(b.name.toLowerCase())) || [];
        }
    },
    orgExists(name){
        return !!Orgs.findOne({ name });
    },
    isAdminOfOrg(name){
        const orgs = _.get(Meteor.user(), 'orgs', []);
        const org = _.find(orgs, (org)=>{
            return org.name === name;
        });
        return (org && org.role === 'admin');
    },
    authMoreOrgsLink(){
        let gitUrl = 'github.com';
        let serviceType = loginType();
        
        var githubLoginService = Accounts.loginServiceConfiguration.findOne({service: serviceType});
        var clientId = _.get(githubLoginService, 'clientId', '');
        if(serviceType === 'ghe') {
            gitUrl = _.get(githubLoginService, 'gheURL', '');
        }
        return `https://${gitUrl}/settings/connections/applications/${clientId}`;
    }
});

Template.SelectOrg.events({
    'click .refresh-btn'(){
        refreshStatus.set('fa-spin');
        Meteor.call('reloadUserOrgList', ()=>{
            refreshStatus.set('');
        });
    }
});

Template.SelectOrg_git.helpers({
    scmIcon() {
        return loginType() === 'bitbucket' ? 'fa-bitbucket' : 'fa-github';
    }
});

Template.AddLocalOrg.events( {
    'submit .js-new-org'(){
        refreshStatus.set('fa-spin');
        const textInput = document.getElementById('new-org');
        Meteor.call('registerLocalOrg', textInput.value, () => {
            textInput.value = '';
            refreshStatus.set('');
        });
        return false;
    }
});

Template.SelectOrg_register.onCreated(function(){
    this.autorun(()=>{
        this.subscribe('orgsForUser');
    });
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
            Meteor.subscribe('orgsForUser');
            if(err){
                throw err;
            }
        });
        return false;
    },
   
});

Template.SelectOrg_deregister.onCreated(function(){
    this.autorun(()=>{
        this.subscribe('orgsForUser');
    });
    this.isDeRegistering = new ReactiveVar(false);
});

Template.SelectOrg_deregister.helpers({
    isDeRegistering(){
        return Template.instance().isDeRegistering.get();
    },
    orgName(){
        return Template.currentData().org.name;
    }
});
Template.SelectOrg_deregister.events({
    'click .deRegisterOrgBtn'(e){
        var $el = $(e.currentTarget);
        var $modal = $el.siblings('.modal');
        $modal.modal();

        return false;
    },
    'click .confirmDeRegisterOrgBtn'(e){
        const inst = Template.instance();
        const orgName = Template.currentData().org.name;

        // removes the modal (and modal backdrop)
        $(e.currentTarget).closest('.modal').modal('hide');

        inst.isDeRegistering.set(true);
        Meteor.call('deRegisterOrg', orgName, (err)=>{
            Meteor.subscribe('orgsForUser');
            if(err){
                throw err;
            }
        });
        return false;
    },
});
