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

import { Meteor } from 'meteor/meteor';
import _ from 'lodash';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { ServiceConfiguration } from 'meteor/service-configuration';

AccountsTemplates.configure({
    texts: {
        socialIcons: {
            'ghe': 'fa fa-github'
        }
    },
});

const sanitizeUrl = (url) => {

    const httpCheck = /^((http|https):\/\/)/;
    if(!httpCheck.test(url)) {
        url = `https://${url}`;
    }

    const trailingSlash = /\/*$/gi;
    const newUrl = url.replace(trailingSlash, '');

    return newUrl;
};

// A user can logon via github, github enterprise, bitbucket or they can create a local id/password stored in mongo
// `localUser` is used throughout our code so that we can skip calls to the github api for local users
function localUser() {
    if( _.has(Meteor.user(), 'services.github') || _.has(Meteor.user(), 'services.ghe') || _.has(Meteor.user(), 'services.bitbucket') ) {
        return false;
    } else {
        return true;
    }
}

function loginType() {
    const service = getServiceConfiguration();
    return service;
}

function getServiceConfiguration() {
    const config = ServiceConfiguration.configurations.findOne({});
    return config ? config.service : undefined;
}

export { localUser, loginType, getServiceConfiguration, sanitizeUrl };
