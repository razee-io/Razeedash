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
import { localUser } from '/imports/api/lib/login.js';
import _ from 'lodash';

export const requireOrgAccess = (orgId)=>{
    let accessibleOrgs;
    let accessibleOrgNames;
    if(localUser()) {
        accessibleOrgNames = _.map(Orgs.find({ type: 'local' }, { name: 1 }).fetch(), 'name');
        
    } else {
        accessibleOrgs = _.get(Meteor.user(), 'github.orgs', []);
        accessibleOrgNames = _.map(accessibleOrgs, 'name');
    }

    let org = Orgs.findOne({_id: orgId});
    if(org && _.includes(accessibleOrgNames, org.name)){
        return true;
    }
    const errorMessage = `you dont have access to org ${_.get(org, 'name', `_id ${orgId}`)}`;
    throw new Meteor.Error(errorMessage);
};
