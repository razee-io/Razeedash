
import './page.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { DeployableVersions } from '/imports/api/deployables/channels/deployableVersions';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';

let versionsHandle;
Template.channel_versions_all.onCreated(function() {
    this.autorun(()=>{
        versionsHandle = Meteor.subscribe('deployableVersions', Session.get('currentOrgId'));
        Meteor.subscribe('channels', Session.get('currentOrgId'));
    });
    
});

Template.channel_versions_all.helpers({
    versions() {
        const channelId = FlowRouter.current().params.id;
        return DeployableVersions.find({'org_id': Session.get('currentOrgId'), 'channel_id': channelId}, { sort: { 'created': -1 }}).fetch();
    },
    showNoVersionsMessage() {
        const channelId = FlowRouter.current().params.id;
        const versions = DeployableVersions.find({'org_id': Session.get('currentOrgId'), 'channel_id': channelId}).fetch();
        const noVersions = (versions && versions.length > 0) ? false : true;
        return versionsHandle && versionsHandle.ready() && noVersions;
    }
});

Template.channel_versions_all.events({
    'click .js-version-details'(e) {
        e.preventDefault();
        const versionId = $(e.target).closest('.js-version-details').data('id');
        const channelId = FlowRouter.current().params.id;
        const params = { 
            baseOrgName: Session.get('currentOrgName'),
            tabId: 'channels',
            id: channelId,
            versionId 
        };
        FlowRouter.go('channel.version.details', params );
    },
});
