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

import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'lodash';

import '../../components/clustersByKubeVersion';
import '../../components/activeDeployments';
import '../../components/updaterMessages';
import '../../components/sevenDayDeployments';
import '../../components/recentDeployments';
import '../../components/inactiveClusters';
import '../../components/portlet';
import './page.html';
import './page.scss';

import { Meteor } from 'meteor/meteor';
import Clipboard from 'clipboard';

var hasOrgAccess = new ReactiveVar(false);
import { Session } from 'meteor/session';
import { Clusters } from '/imports/api/cluster/clusters/clusters.js';
import { Orgs } from '/imports/api/org/orgs.js';
import { localUser, loginType } from '/imports/api/lib/login.js';

Template.page_welcome.onCreated(function() {
    this.autorun(()=>{
        this.subscribe('orgsForUser');
        this.subscribe('userData');
    });

    this.autorun(()=>{
        var orgName = Session.get('currentOrgName');
        var userOrgs;
        if(loginType() === 'bitbucket') {
            userOrgs = _.get(Meteor.user(), 'bitbucket.teams', []);
        } else {
            userOrgs = _.get(Meteor.user(), 'github.orgs', []);
        }
        var userOrgNames = _.map(userOrgs, 'name');
        
        if(localUser()) {
            userOrgNames = _.map(Orgs.find({ type: 'local' }, { name: 1 }).fetch(), 'name');
        } 
        hasOrgAccess.set(_.includes(userOrgNames, orgName));
    });

    this.clusterCount = new ReactiveVar();
    this.deploymentCount = new ReactiveVar();
    this.autorun(() => {
        if(Session.get('currentOrgId')) {
            this.subscribe('resourceStats', Session.get('currentOrgId'));
            this.subscribe('clusters.org', Session.get('currentOrgId'));
        }
        // if has access, sets the user's currentOrgName attr
        if(hasOrgAccess.get()){
            Meteor.call('setAsCurrentOrgName', Session.get('currentOrgName'));
        }
    });
});


Template.page_welcome.onRendered( () => {
    new Clipboard('.copy-button');
});

Template.page_welcome.helpers({
    hasOrgAccess(){
        return hasOrgAccess.get();
    },
    hasClusters() {
        return Clusters.find({ org_id: Session.get('currentOrgId')}).count();
    },
    org() {
        if(hasOrgAccess.get()){
            const org = Orgs.findOne({ name: Session.get('currentOrgName') } );
            return org;
        }
    }
});
