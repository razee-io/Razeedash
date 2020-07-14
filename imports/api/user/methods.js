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
import { Random } from 'meteor/random';
import log from '../lib/log.js';

Meteor.methods({
    generateApikey() {
        log.info('Generate API key', { userid: this.userId });
        const newKey = Random.hexString(32);
        Meteor.users.update(this.userId, { $set: { apiKey: newKey } });
        return newKey;
    },
    getApiKey() {
        const user = Meteor.users.findOne(this.userId);
        if(!user.apiKey) {
            const newKey = Random.hexString(32);
            log.info('Generate API key for new graphql user', { userid: this.userId });
            Meteor.users.update(this.userId, { $set: { apiKey: newKey } });
            return newKey;
        } else {
            return user.apiKey;
        }
    },
    setToken(newAccessToken) {
        Meteor.users.update(this.userId,  { $set: { 'services.bitbucket.accessToken': newAccessToken } });
    }
});
