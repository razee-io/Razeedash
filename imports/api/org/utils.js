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
import { Orgs } from './orgs.js';
import _ from 'lodash';

export const requireOrgAccess = (orgId)=>{
    var accessibleOrgs = _.get(Meteor.user(), 'github.orgs', []);
    var accessibleOrgNames = _.map(accessibleOrgs, 'name');
    var org = Orgs.findOne({_id: orgId});
    if(org && _.includes(accessibleOrgNames, org.name)){
        return true;
    }
    const errorMessage = `you dont have access to org ${_.get(org, 'name', `_id ${orgId}`)}`;
    throw new Meteor.Error(errorMessage);
};

export const requireOrgAdmin = (orgId)=>{
    var org = Orgs.findOne({  _id: orgId });
    var userObj = Meteor.user();
    var userOrgs = _.get(userObj, 'github.orgs');
    var userOrg = _.find(userOrgs, (userOrg)=>{
        return (userOrg.name === _.get(org, 'name'));
    });
    if(!userOrg || userOrg.role !== 'admin'){
        throw new Meteor.Error('save-error', `You must be a GitHub "${_.get(org, 'name', orgId)}" org admin to update it.`);
    }
};
