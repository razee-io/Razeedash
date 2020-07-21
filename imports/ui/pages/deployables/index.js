
import './channels';
import './channel';
import './versions';
import './version';
import './clusterGroups';
import './clusterGroup';
import '../../components/icons';
import './page.html';
import './page.scss';
import { Template } from 'meteor/templating';	
import { FlowRouter } from 'meteor/kadira:flow-router';

Template.page_deployables.helpers({
    isActiveTab(tabId) {
        if ( FlowRouter.getParam('tabId') === tabId ) {
            return 'active';
        }
        return false;
    }
});
