
import './component.html';
import './helpModal.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Channels } from '/imports/api/deployables/channels/channels';
import { DeployableVersions } from '/imports/api/deployables/channels/deployableVersions';
import { Subscriptions } from '/imports/api/deployables/subscriptions/subscriptions.js';
import { FlowRouter } from 'meteor/kadira:flow-router';
import Clipboard from 'clipboard';

import _ from 'lodash';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

let editMode = new ReactiveVar(false);
let showNewAppRow = new ReactiveVar(false);
let clickedItem = new ReactiveVar(null);

let channelHandle;
Template.channels.onCreated(function() {
    this.autorun(()=>{
        channelHandle = Meteor.subscribe('channels', Session.get('currentOrgId'));
        Meteor.subscribe('subscriptions', Session.get('currentOrgId'));
        Meteor.subscribe('deployableVersions', Session.get('currentOrgId'));
        editMode.set(false);
    });
    $(function() {
        $('[data-toggle="tooltip"]').tooltip();
    });
});

Template.channels.onRendered( () => {
    const clipboard = new Clipboard('.copy-button');
    clipboard.on('success', function(e) {
        $(e.trigger).tooltip('show');
        e.clearSelection();
    });
});

Template.channels.helpers({
    showNoChannelsMessage() {
        const channels = Channels.find({'org_id': Session.get('currentOrgId')}).fetch();
        const noChannels = (channels && channels.length > 0) ? false : true;
        return channelHandle && channelHandle.ready() && noChannels && !showNewAppRow.get();
    },
    showNewAppRow() {
        return showNewAppRow.get();
    },
    dataReady() {
        return channelHandle && channelHandle.ready();
    },
    channels(){
        const channels = Channels.find({'org_id': Session.get('currentOrgId')}).fetch();
        if(channels && channels.length > 0) {
            return channels;
        }
    },
    resourceVersions(resourceId) {
        const versions = DeployableVersions.find({'org_id': Session.get('currentOrgId'), 'channel_id': resourceId}).fetch();
        return versions.length || 0; 
    },
    subscriptions(channelId) {
        const subscriptions = Subscriptions.find({'org_id': Session.get('currentOrgId'), 'channel_uuid': channelId}).fetch();
        return subscriptions.length || 0;
    },
    editMode(id) {
        return id == clickedItem.get() ? true : false;
    },
    editModeClass(id) {
        return id == clickedItem.get() ? 'resource-item-edit' : 'resource-item';
    },
    clickedItem() {
        return clickedItem.get();
    }
});

Template.channel_add.onRendered(function() {
    this.find('input').focus();
});

Template.channels.events({
    'click .js-channel-details'(e) {
        e.preventDefault();
        const id = $(e.target).closest('.resource-item').data('id');
        const params = { 
            baseOrgName: Session.get('currentOrgName'),
            tabId: 'channels',
            id: id 
        };
        FlowRouter.go('channel.details', params );
    },
    'click .js-add-resource'(e) {
        e.preventDefault();
        const resourceName = $(e.target).closest('.resource-item-new').find('input[name="resourceName"]').val();

        if(!resourceName|| resourceName.length == 0) {
            $(e.target).closest('.resource-item-new').find('input[name="resourceName"]').addClass('is-invalid').focus();
            return false;
        }

        const channels = Template.channels.__helpers.get('channels').call();
        if(channels) {
            const existingAppNames = channels.map( (item) => item.name );
            if(_.includes(existingAppNames, resourceName)) {
                $(e.target).closest('.resource-item-new').find('input[name="resourceName"]').addClass('is-invalid').focus();
                return false;
            }
        }

        Meteor.call('addChannel', Session.get('currentOrgId'), resourceName,  (error)=>{
            if(error) {
                toastr.error(error.error, 'Error adding the channel');
            } else {
                Meteor.setTimeout(function(){
                    editMode.set(false);
                    showNewAppRow.set(false);
                }, 100);
                return false;
            }
        });

    },
    'click .js-create-resource'(e) {
        e.preventDefault();
        showNewAppRow.set(true);
        $(e.target).closest('.resource-item-new').find('input[name="resourceName"]').focus();
        editMode.set(true);
    },
    'click .js-resource-help'(e){
        e.preventDefault();
        clickedItem.set(null);
        const $modal = $('.js-resource-help-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-cancel-add-resource'(e) {
        e.preventDefault();
        showNewAppRow.set(false);
        editMode.set(false);
    },

});
