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

import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { ExternalApplications } from './externalApplications.js';
import { requireOrgAccess } from '/imports/api/org/utils.js';

// https://docs.meteor.com/api/check.html
const NonEmptyString = Match.Where((x) => {
    check(x, String);
    return x.length > 0;
});

Meteor.methods({
    async getExternalApplications(orgId){
        check(orgId, String);
        requireOrgAccess(orgId);

        const search = { org_id: orgId };
        const options = {
            sort: {
                updated: -1,
            }
        };
        return ExternalApplications.find(search, options).fetch();
    },
    updateApplication(orgId, appId, appName, url, nameMatch='', kindMatch=''){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( appId, String );
        check( appName, String );
        check( url, String );
        check( nameMatch, Match.Maybe(String) );
        check( kindMatch, Match.Maybe(String) );
        
        ExternalApplications.update(
            { 
                'org_id': orgId,
                _id: appId
            }, 
            { 
                $set: 
                { 
                    'name': appName,
                    'url': url,
                    'nameMatch': nameMatch,
                    'kindMatch': kindMatch,
                    'updated': new Date() 
                } 
            });
        return true;
    },
    addApplication(orgId, appName, url, nameMatch, kindMatch){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( appName, NonEmptyString);
        check( url, NonEmptyString);
        check( nameMatch, Match.Maybe(String) );
        check( kindMatch, Match.Maybe(String) );

        ExternalApplications.insert({
            'org_id': orgId,
            'name': appName,
            'url': url,
            'nameMatch': nameMatch,
            'kindMatch': kindMatch,
            'created': new Date()
        });
        return true;
    },
    removeApplication(orgId, appName){
        requireOrgAccess(orgId);
        check( orgId, String );
        check( appName, String );
        
        ExternalApplications.remove({ 'org_id': orgId, 'name': appName });

        return true;
    },

});
