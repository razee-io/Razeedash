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
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Accounts } from 'meteor/accounts-base';

Template.Login.created = function() {
    if (Meteor.user()) {
        FlowRouter.redirect('home');
    }
    else {
        Accounts.ui.config( { requestPermissions: { github: ['user', 'repo'] } } );
    }
};

Template.Login.helpers = {
    isLoginConfigured: () => Accounts.loginServicesConfigured()
};

Template.Login.events({
    'click .razee-login' () {
        if (!Meteor.user()) {
            Meteor.loginWithGithub({ requestPermissions: ['read:user', 'read:org'] }, function() {
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
