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
import uuid from 'uuid';
import { Orgs } from './orgs.js';
import ghe from '../lib/ghe.js';
import { localUser } from '../lib/login.js';
import { requireOrgAccess } from '/imports/api/org/utils.js';

Meteor.methods({
    hasOrgs() {

        let userOrgs = _.get(Meteor.user(), 'github.orgs', []);
        let userOrgNames = _.map(userOrgs, 'name');

        if(localUser()) {
            userOrgNames = _.map(Orgs.find({ type: 'local' }, { name: 1 }).fetch(), 'name');
        }

        const userOrgsInMeteor = Orgs.find({ name: { $in: userOrgNames } }).count();
        if(userOrgsInMeteor === 0) {
            return false;
        } else {
            return true;
        }
    }, 
    setAsCurrentOrgName(orgName){
        var userId = Meteor.userId();
        if(!userId){
            throw new Meteor.Error('not logged in');
        }
        Meteor.users.update({ _id: userId}, { $set: { 'profile.currentOrgName': orgName } });
    },
    reloadUserOrgList(){
        var userObj = Meteor.users.findOne({ _id: Meteor.userId() });
        if(userObj && !localUser()) {
            var orgs = ghe.listOrgs(userObj);
            Meteor.users.update({ _id: userObj._id}, { $set: { 'github.orgs': orgs } });
        } 
    },
    registerLocalOrg(name){
        check( name, String );
        const userObj = Meteor.user();
        const org = Orgs.findOne({
            $and: [
                { name },
                { type: 'local' }
            ]
        });

        if(org){
            throw new Meteor.Error(`org "${name}" already exists`);
        }

        const orgKey = `orgApiKey-${uuid()}`;
        Orgs.insert({
            name,
            creatorUserId: userObj._id,
            orgKeys: [orgKey],
            type: 'local',
            avatarUrl: '/img/razeedash.svg',
            created: new Date(),
            updated: new Date()
        });
        return true;
    },
    registerOrg(name){
        check( name, String );
        var userObj = Meteor.user();
        var userOrgs = _.get(userObj, 'github.orgs');
        var userOrg = _.find(userOrgs, (org)=>{
            return (org.name == name);
        });
        if(!userOrg || userOrg.role != 'admin'){
            throw new Meteor.Error(`You must be a GitHub "${name}" org admin to register it.`);
        }
        var org = Orgs.findOne({ name });
        if(org){
            throw new Meteor.Error(`org "${name}" already exists`);
        }

        var orgKey = `orgApiKey-${uuid()}`;
        Orgs.insert({
            name,
            creatorUserId: userObj._id,
            orgKeys: [orgKey],
            gheOrgId: userOrg.gheOrgId,
            created: new Date(),
            updated: new Date()
        });
        return true;
    },
    deRegisterOrg(name){
        check( name, String );
        if(localUser()) {
            const org = Orgs.findOne({
                $and: [
                    { name },
                    { type: 'local' }
                ]
            });

            if(org){
                Orgs.remove({
                    $and: [
                        { name },
                        { type: 'local' }
                    ]
                });
            } else {
                throw new Meteor.Error(`org "${name}" was not found.`);
            }
        } else {
            var userObj = Meteor.user();
            var userOrgs = _.get(userObj, 'github.orgs');
            var userOrg = _.find(userOrgs, (org)=>{
                return (org.name == name);
            });
            if(!userOrg || userOrg.role != 'admin'){
                throw new Meteor.Error(`You must be a GitHub "${name}" org admin to de-register it.`);
            }
            Orgs.remove({ name: name });
        }
        return true;
    },
    saveCustomSearchableAttrsObj(orgId, data){
        requireOrgAccess(orgId);
        var search = {
            _id: orgId,
        };
        var sets = {
            'customSearchableAttrs': data,
        };
        Orgs.update(search, { $set: sets });
    },
});
