
import './channels';
import './channel';
import './versions';
import './version';
import './clusterGroups';
import './clusterGroup';
import '../../components/icons';
import './page.html';
import './page.scss';
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
