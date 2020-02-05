
import './subscriptions/index.js';
import './channels/index.js';
import './page.html';
import './apiHelp.html';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Orgs } from '/imports/api/org/orgs';
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.Channels.onCreated(function() {
    this.autorun(()=>{
        Meteor.subscribe('channels', Session.get('currentOrgId'));
    });
});

Template.api_example.helpers({
    apiUrl() {
        let apiUrl = 'RAZEE_API';
        if(Meteor.settings.public.RAZEEDASH_API_URL){
            apiUrl = Meteor.settings.public.RAZEEDASH_API_URL;
            if(apiUrl.substr(-1) !== '/') {
                apiUrl += '/';
            }
        }
        return apiUrl;
    },
    org() {
        const orgName = FlowRouter.getParam('baseOrgName');
        const org = Orgs.findOne({ name: orgName });
        return org;
    }
});
