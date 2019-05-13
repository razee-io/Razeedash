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
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Orgs } from '/imports/api/org/orgs';
import toastr from 'toastr';

Template.AdminOrgsHome.onCreated(function(){
    this.autorun(()=>{
        this.subscribe('allRegisteredOrgs');
    });
});

Template.AdminOrgsHome.helpers({
    orgs(){
        return Orgs.find({});
    },
});

Template.AdminOrgsSingle.onCreated(function(){
    this.autorun(()=>{
        this.orgName = FlowRouter.getParam('orgName');
        this.subscribe('orgs', [ this.orgName ]);
    });
});

Template.AdminOrgsSingle.helpers({
    org(){
        return Orgs.findOne({name: Template.instance().orgName});
    },
});

Template.AdminOrgRegister.onCreated(function(){
    this.isRunning = new ReactiveVar(false);
});

Template.AdminOrgRegister.helpers({
    isRunning(){
        return Template.instance().isRunning.get(true);
    }
});

Template.AdminOrgRegister.events({
    'click .registerOrgBtn'(e){
        var inst = Template.instance();
        var $el = $(e.currentTarget).closest('.registerOrgBtn');
        var $form = $el.closest('form');
        var orgName = $form.find('.orgNameInput').val();

        inst.isRunning.set(true);
        Meteor.call('registerOrg', orgName, (err)=>{
            inst.isRunning.set(false);
            if(err){
                toastr.error(err.error, `Failed to register org ${orgName}`);
                throw err;
            }
            window.location = FlowRouter.path('admin.org', { orgName }, {});
        });
        return false;
    },
});
