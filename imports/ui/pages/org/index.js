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

import './page.html';
import './page.scss';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Orgs } from '/imports/api/org/orgs';
import Clipboard from 'clipboard';

Template.OrgSingle.onCreated( () => {
    const template = Template.instance();
    template.autorun(()=>{
        var orgName = FlowRouter.getParam('baseOrgName');
        template.orgName = orgName;
        template.org = Orgs.findOne({ name: orgName, });
    });
});

Template.OrgSingle.onRendered( () => {
    new Clipboard('.copy-button');
});

Template.OrgSingle.helpers({
    org(){
        return Orgs.findOne({ name: Template.instance().orgName });
    },
    clusterYamlUrl(key){
        var url = Meteor.absoluteUrl(`api/install/cluster?orgKey=${key}`);
        if(Meteor.settings.public.RAZEEDASH_API_URL){
            url = `${Meteor.settings.public.RAZEEDASH_API_URL}api/install/cluster?orgKey=${key}`;
        }
        return url;
    },
    firstOrgKey(org){
        return org.orgKeys[0];
    }
});
