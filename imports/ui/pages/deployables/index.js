
import './subscriptions/index.js';
import './channels/index.js';
import './page.html';

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

Template.Channels.onCreated(function() {
    this.autorun(()=>{
        Meteor.subscribe('channels', Session.get('currentOrgId'));
    });
});
