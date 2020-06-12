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
import { OAuth } from 'meteor/oauth';
import { HTTP } from 'meteor/http';
import log from './log.js';
import _ from 'lodash';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { loginType, sanitizeUrl } from './login.js';

function listOrgs(loggedInUserObj){
    const serviceName = loginType();
    let gitUrl = 'https://api.github.com';
    if(serviceName === 'ghe') {
        let {gheURL} = ServiceConfiguration.configurations.findOne({ service: 'ghe' }, {fields: {gheURL: 1}});
        gitUrl = sanitizeUrl(gheURL) + '/api/v3';
    } 

    const url = `${gitUrl}/user/memberships/orgs?state=active&per_page=100`;
    const token = OAuth.openSecret( loggedInUserObj.services[serviceName].accessToken, loggedInUserObj._id );

    const options = {
        headers: {
            Authorization: `bearer ${token}`,
            'User-Agent': 'razeedash' 
        },
    };
    var response;
    try {
        response = HTTP.get(url, options);
    }catch(e){
        log.info('http error', { e });
        return false;
    }
    const data = response.data;
    if(!data){
        return [];
    }
    // returns the list of user org objs
    return _.map(data, (item)=>{
        var org = item.organization;
        if(!org){
            throw new Meteor.Error('GitHub returned a role obj without an org');
        }
        if(!item.role){
            throw new Meteor.Error('GitHub returned a role obj with a role set');
        }
        return {
            name: org.login,
            gheOrgId: org.id,
            role: item.role,
            url: org.url,
            desc: org.description,
            avatarUrl: org.avatar_url,
        };
    });
}

export { listOrgs };
