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
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';

let selectedService = new ReactiveVar(undefined);

Template.Login.onCreated(function(){
    this.autorun(()=>{
        selectedService.set(undefined);
    });
});
Template.atSocial.onRendered(function(){
    this.autorun(()=>{
        if(Template.instance().view.isRendered){
            Template.instance().$('.at-social-btn').animate({ opacity: 1 }, 400 );
        }
    });
});

function animateServiceDialog() {
    $('#configure-login-service-dialog').animate({opacity: 1}, 400);
}
Template.configureLoginServiceDialogForGhe.onRendered(function() {
    this.autorun(()=>{
        if(Template.instance().view.isRendered){
            animateServiceDialog();
        }
    });
});
Template.configureLoginServiceDialogForBitbucket.onRendered(function() {
    this.autorun(()=>{
        if(Template.instance().view.isRendered){
            animateServiceDialog();
        }
    });
});
Template.configureLoginServiceDialogForGithub.onRendered(function() {
    this.autorun(()=>{
        if(Template.instance().view.isRendered){
            animateServiceDialog();
        }
    });
});
// This is used in the customAtForm template to determine whether or not 
// to show the email/password login form
Template.atForm.helpers({
    showPwdForm() {
        return Meteor.settings.public.LOGIN_TYPE === 'local';
    },
});

const serviceData = {
    'ghe': {
        'img': 'img/Octocat.png',
        'label': 'GitHub Enterprise'
    },
    'github': {
        'img': 'img/GitHub_Logo.png',
        'label': 'GitHub'
    },
    'bitbucket': {
        'img': 'img/bitbucket.svg',
        'label': 'Bitbucket'
    }
};

// This is used in the customAtOauth template 
Template.atOauth.helpers({
    showSelectedService(service) {
        if(service._id === selectedService.get()) {
            return service;
        }
    },
    serviceImg(service) {
        return serviceData[service].img;
    },
    serviceLabel(service) {
        return serviceData[service].label;
    },
    getServiceClass(service) {
        if(service === selectedService.get()) {
            return 'border-primary';
        } else {
            return 'border-grey';
        }
    }
});

Template.atOauth.events({
    'click .js-configure-service'(event) {
        event.preventDefault();
        if(event.currentTarget.dataset.service) {
            selectedService.set(event.currentTarget.dataset.service);
        }
    }
});

Template.Login.events({
    'click #at-ghe'(event) {
        event.preventDefault();
        if (!Meteor.user()) {
            Meteor.loginWithGhe({ requestPermissions: ['read:user', 'read:org'] }, function() {
                Meteor.call('reloadUserOrgList', ()=> {
                    FlowRouter.go('welcome');
                });
            });
        } else {
            Meteor.logout(function() {
                FlowRouter.go('/login');
            });
        }
    }
});
