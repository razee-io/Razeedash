
import './subscriptions/index.js';
import './channels/index.js';
import './page.html';
import './apiHelp.html';
import { Meteor } from 'meteor/meteor';	
import { Template } from 'meteor/templating';	

Template.api_example.events({	
    'click .js-generate-key': function() {	
        Meteor.call('generateApikey');	
    }	
});	
