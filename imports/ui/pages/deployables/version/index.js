
import './page.html';
import './page.scss';
import '../../../components/deployables/versionDetails';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
// import { Channels } from '/imports/api/deployables/channels/channels';
import { DeployableVersions } from '/imports/api/deployables/channels/deployableVersions';
// import { Subscriptions } from '/imports/api/deployables/subscriptions/subscriptions.js';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
// import toastr from 'toastr';
import { ReactiveVar } from 'meteor/reactive-var';
import ace from 'ace-builds/src-min-noconflict/ace';
// eslint-disable-next-line
import yamlMode from 'ace-builds/src-min-noconflict/mode-yaml';

Template.channel_version.onCreated(function() {
    const self = this;
    self.versionContent = new ReactiveVar('Loading resource...');
    const channelId = FlowRouter.current().params.id;
    const versionId= FlowRouter.current().params.versionId;
    Meteor.call('getChannelVersion', Session.get('currentOrgId'), channelId, versionId, (err, response) => {	
        if (err) {
            self.versionContent.set(err.error);
        }
        else {
            self.versionContent.set(response.data.getChannelVersion.content);
        } 
    });
});

Template.channel_version.onRendered(function() {
    this.autorun(()=>{
        Meteor.subscribe('deployableVersions', Session.get('currentOrgId'));
        Meteor.subscribe('channels', Session.get('currentOrgId'));
    });
    const template = Template.instance();
    template.editor = ace.edit( 'editor' );
    template.editor.setShowPrintMargin(false);
    template.editor.session.setMode( 'ace/mode/yaml' );
});

Template.channel_version.helpers({
    version() {
        const channelId = FlowRouter.current().params.id;
        const versionId= FlowRouter.current().params.versionId;
        const version = DeployableVersions.findOne({'org_id': Session.get('currentOrgId'), 'channel_id': channelId, 'uuid': versionId}, { sort: { 'created': -1 }});
        return version;
    },
    resourceDetails() {
        const template = Template.instance();
        if(template.editor) {
            template.editor.setValue(template.versionContent.get());
            template.editor.gotoLine(1);
        }
        return Template.instance().versionContent.get();
    },
});
