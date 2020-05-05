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
import { Orgs } from '/imports/api/org/orgs';
import log from '../lib/log.js';

const jwt = require('jsonwebtoken');

const generateUserToken = (orgId) => {
    // used for making calls into razeedash-api 
    const user = Meteor.userId();
    log.info('Generating user token', {orgId, user: user});
    const org = Orgs.findOne({_id: orgId});
    const secret = org.orgKeys[0];
    const token = jwt.sign({ 'userId': user, 'orgId': orgId}, secret);
    // Meteor.users.update(user, { $set: { userToken: token } });
    return token;
};

exports.generateUserToken = generateUserToken;
