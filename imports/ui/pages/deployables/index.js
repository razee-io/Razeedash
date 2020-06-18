
import './subscriptions/index.js';
import './channels/index.js';
import './labels/index.js';
import './page.html';
import './apiHelp.html';
import { Meteor } from 'meteor/meteor';	
import { Template } from 'meteor/templating';	
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.api_example.events({	
    'click .js-generate-key': function() {	
        Meteor.call('generateApikey');	
    }	
});	

Template.api_example.helpers({
    orgId() {
        return Session.get('currentOrgId');
    }
});

Template.page_deployables.helpers({
    isActiveTab(tabId) {
        if ( FlowRouter.getParam('tabId') === tabId ) {
            return 'active';
        }
        return false;
    }
});
