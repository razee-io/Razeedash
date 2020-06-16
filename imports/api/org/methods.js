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
import { v4 as uuid } from 'uuid';
import { Orgs } from './orgs.js';
import ghe from '../lib/ghe.js';
import bitbucket from '../lib/bitbucket.js';
import { localUser, loginType } from '../lib/login.js';
import { requireOrgAccess } from '/imports/api/org/utils.js';

Meteor.methods({
    hasOrgs() {

        const userOrgs = _.get(Meteor.user(), 'orgs', []);
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
            if(loginType() === 'bitbucket') {
                const teams = bitbucket.listTeams(userObj);
                Meteor.users.update({ _id: userObj._id}, { $set: { 'orgs': teams } });
            } else {
                const orgs = ghe.listOrgs(userObj);
                Meteor.users.update({ _id: userObj._id}, { $set: { 'orgs': orgs } });
            }
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
        const userObj = Meteor.user();
        const userOrgs = _.get(userObj, 'orgs');
        const userOrg = _.find(userOrgs, (org)=>{
            return (org.name == name);
        });
        if(!userOrg || userOrg.role != 'admin'){
            throw new Meteor.Error(`You must be a "${name}" admin to register it.`);
        }
        const org = Orgs.findOne({ name });
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
            const serviceName = loginType();
            const userObj = Meteor.user();
            const userOrgs = _.get(userObj, 'orgs');
            const userOrg = _.find(userOrgs, (org)=>{
                return (org.name == name);
            });
            if(!userOrg || userOrg.role != 'admin'){
                throw new Meteor.Error(`You must be a ${serviceName} admin of "${name}" to de-register it.`);
            }
            Orgs.remove({ name: name });
        }
        return true;
    },
    addCustomSearchableAttrKind(orgId, kind){
        check(orgId, String);
        check(kind, String);
        requireOrgAccess(orgId);
        var search = {
            _id: orgId,
            [`customSearchableAttrs.${kind}`]: { $exists: false },
        };
        var sets = {
            [`customSearchableAttrs.${kind}`]: [],
        };
        Orgs.update(search, { $set: sets });
    },
    deleteCustomSearchableAttrKind(orgId, kind){
        check(orgId, String);
        check(kind, String);
        requireOrgAccess(orgId);
        var search = {
            _id: orgId,
        };
        Orgs.update(search, { $unset: { [`customSearchableAttrs.${kind}`]: true } });
    },
    setCustomSearchableAttrKindIdx(orgId, kind, idx, val){
        check(orgId, String);
        check(kind, String);
        check(idx, Number);
        check(val, String);
        requireOrgAccess(orgId);
        var search = {
            _id: orgId,
        };
        var updateObj = {
            $set: {
                [`customSearchableAttrs.${kind}.${idx}`]: val,
            },
        };
        if(idx == -1){
            updateObj = {
                $push: {
                    [`customSearchableAttrs.${kind}`]: val,
                },
            };
        }
        Orgs.update(search, updateObj);
    },
    deleteCustomSearchableAttrKindIdx(orgId, kind, idx){
        check(orgId, String);
        check(kind, String);
        check(idx, Number);
        var search = {
            _id: orgId,
        };
        // apparently mongo doesnt let you remove an array item by index, so what we'll do is set the item to null and then remove all nulls
        // sets the item to null
        Orgs.update(search, { $unset: { [`customSearchableAttrs.${kind}.${idx}`]: true } });
        // removes all nulls
        Orgs.update(search, { $pull: { [`customSearchableAttrs.${kind}`]: null } });
    }
});
