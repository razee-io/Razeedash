
import '../../components/deployables/channels';
import './versions';
import './version';
import '../../components/deployables/clusterGroups';
import '../../components/icons';
import './channel/index.js';
import './clusterGroup/index.js';
import './page.html';
import './apiHelp.html';
import { Template } from 'meteor/templating';	
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

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
