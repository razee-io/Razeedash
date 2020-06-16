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

// Import server startup through a single index entry point

import './register-api.js';

import { Meteor } from 'meteor/meteor';
import { OAuthEncryption } from 'meteor/oauth-encryption';
import log from '/imports/api/lib/log.js';
import _ from 'lodash';

const migrateUnencryptedUsers = () => {
    const cursor = Meteor.users.find({
        $and: [
            { 'services.github.accessToken': { $exists: true } },
            { 'services.github.accessToken.algorithm': { $exists: false } }
        ]
    });

    cursor.forEach((userDoc) => {
        const set = {};

        ['accessToken', 'accessTokenSecret', 'refreshToken'].forEach((field) => {
            const plaintext = userDoc.services.github[field];

            if (!_.isString(plaintext)) {
                return;
            }

            set[`services.github.${field}`] = OAuthEncryption.seal(
                plaintext,
                userDoc._id
            );
        });

        Meteor.users.update(userDoc._id, { $set: set });
    });
};

// Move any github and bitbucket user orgs to a lower level in the user object
//   user.github.orgs[]     -> user.orgs[]
//   user.bitbucket.teams[] -> user.orgs[]
const migrateUserOrgs = () => {
    const cursor = Meteor.users.find({ 
        orgs: { $exists: false },
        $or: [
            { 'github.orgs': { $exists: true } }, 
            { 'bitbucket.teams': { $exists: true }}
        ]
    });
    cursor.forEach((userDoc) => {
        log.info(`migrating orgs for ${userDoc._id}`);
        let userOrgs;
        if(userDoc.github && userDoc.github.orgs) {
            userOrgs = userDoc.github.orgs;
        } else {
            userOrgs = userDoc.bitbucket.teams;
        }
        try{
            Meteor.users.update({'_id': userDoc._id}, { $set: { 'orgs': userOrgs} });
        } catch (error){
            log.error(error);
        }
    });
};

Meteor.startup(()=>{
    // envs copied over to client
    Meteor.settings.public.GITHUB_URL = process.env.GITHUB_URL || 'https://github.com/';
    Meteor.settings.public.GITHUB_API = process.env.GITHUB_API || 'https://api.github.com/';
    Meteor.settings.public.BITBUCKET_URL = process.env.BITBUCKET_URL || 'https://bitbucket.org/';
    Meteor.settings.public.BITBUCKET_API = process.env.BITBUCKET_API || 'https://api.bitbucket.org/2.0/';
    Meteor.settings.public.RAZEE_GITHUB_URL = 'https://github.com/razee-io/razeedash';
    Meteor.settings.public.RAZEEDASH_API_URL = process.env.RAZEEDASH_API_URL || null;

    const versionInfo = {
        buildId: process.env.BUILD_ID || '$$BUILD_ID$$',
        lastCommitId: process.env.LAST_COMMIT_ID || '$$LAST_COMMIT_ID$$',
    };
    versionInfo.str = `${versionInfo.buildId}_${versionInfo.lastCommitId}`;
    Meteor.settings.public.version = versionInfo;
    
    if ( process.env.OAUTH_SECRET_KEY ) {
        migrateUnencryptedUsers();
    }
    migrateUserOrgs();
});
