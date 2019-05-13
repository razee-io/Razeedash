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

import _ from 'lodash';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Orgs } from '../orgs.js';

Meteor.publish('orgIdByName', function(orgName){
    return Orgs.find({ name: orgName }, { _id: 1, name: 1});
});

Meteor.publish('orgs', function(names){
    check( names, [String] );
    return Orgs.find({ name: { $in: names } }, { name: 1 });
});

Meteor.publish('orgsForUser', function(){
    // prevent server errors when the user clicks Logout
    if(!Meteor.user()){
        return;
    }
    var orgNames = _.map(Meteor.user().profile.orgs || [], 'name');
    return Orgs.find({ name: { $in: orgNames } }, { name: 1, orgYaml: 1 });
});

Meteor.publish('gheOrg', (orgName)=>{
    check( orgName, String );
    return Orgs.find({ name: orgName }, { fields: { name: 1, gheOrgId: 1, } });
});

Meteor.publish('allRegisteredOrgs', function(){
    return Orgs.find({});
});
