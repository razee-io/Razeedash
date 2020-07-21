
import './page.html';
import './apiHelp.html';
import '../subscriptions';
import '../subscriptions/groupSelect';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Channels } from '/imports/api/deployables/channels/channels';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import Clipboard from 'clipboard';
import _ from 'lodash';
import ace from 'ace-builds/src-min-noconflict/ace';
import toastr from 'toastr';
// eslint-disable-next-line
import yamlMode from 'ace-builds/src-min-noconflict/mode-yaml';

let editMode = new ReactiveVar(false);
let clickedItem = new ReactiveVar(null);
let loading = new ReactiveVar(null);
const yaml = new ReactiveVar();

Template.api_example.helpers({
    orgId() {
        return Session.get('currentOrgId');
    },
    channelId() {
        return FlowRouter.current().params.id;
    }
});

Template.channel_versions_recent.onRendered(function() {
    const template = Template.instance();
    template.editor = ace.edit( 'editor' );
    template.editor.setShowPrintMargin(false);
    template.editor.session.setMode( 'ace/mode/yaml' );
    template.editor.session.on('change', () => {
        yaml.set( template.editor.getValue() );
    });
});

Template.channel_versions_recent.helpers({
    versions() {
        let recentVersions = Template.currentData().versions ? Template.currentData().versions.reverse() : [];
        return recentVersions.slice(0,3);
    },
});
Template.channel_versions_recent.events({
    'click .js-api-help'(e) {
        e.preventDefault();
        var $modal = $('.js-api-help-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-version-details'(e) {
        e.preventDefault();
        const versionId = $(e.target).data('id');
        const channelId = FlowRouter.current().params.id;
        const params = { 
            baseOrgName: Session.get('currentOrgName'),
            tabId: 'channels',
            id: channelId,
            versionId 
        };
        FlowRouter.go('channel.version.details', params );
    },
    'click .js-view-all-channels'(e) {
        e.preventDefault();
        const id = FlowRouter.current().params.id;
        const params = { 
            baseOrgName: Session.get('currentOrgName'),
            tabId: 'channels',
            id: id 
        };
        console.log(params);
        
        FlowRouter.go('channel.versions', params );
    },
    'change #yaml-upload'(e,t) {	
        const selectedFile = e.currentTarget.files[0];	
        const fileType = e.currentTarget.files[0].type;	
        
        const reader = new FileReader();	
        reader.onload = function(e) {	
            loading.set(true);	
            t.editor.setValue(e.target.result);
        };	
        reader.onloadstart = () => loading.set(true);	
        reader.onloadend = () => loading.set(false);	

        if(fileType === 'application/x-yaml' || fileType === 'application/json') {	
            loading.set(true);	
            reader.readAsText(selectedFile);	
        } else {	
            loading.set(false);	
            $('.yaml-upload-error').show();	
        }	
    },
    'click .js-add-resource-btn, keypress .js-add-resource-btn'(e){	
        e.preventDefault();	
        clickedItem.set(null);	
        var $el = $(e.currentTarget);	
        var $modal = $el.siblings('.js-add-resource-modal');	
        $modal.modal('show');
        return false;
    },
    'click .js-add-resource-confirm': (e) => {
        e.preventDefault();	
        const channelId = FlowRouter.current().params.id;
        const versionName = $('#yaml-upload-name').val();
        const description = $('#yaml-upload-description').val();
        const yamlString = yaml.get();

        if(!versionName || versionName.length == 0) {	
            $('#yaml-upload-name').addClass('is-invalid').focus();	
            return false;	
        }	
        if(!yamlString|| yamlString.length == 0) {	
            return false;	
        }	

        Meteor.call('addChannelVersion', Session.get('currentOrgId'), channelId, versionName, 'application/yaml', yamlString, description, (error) => {	
            if(error) {	            
                toastr.error(`Error adding a resource. ${error.error}`);	               
                $('.yaml-upload-error').show();	
                console.error(error);
            }	            
        });	        
        var $modal = $('.js-add-resource-modal');	
        $modal.modal('hide');	
        return false;
    }
});

let channelHandle;
Template.channel_single.onCreated(function() {
    this.autorun(()=>{
        const channelId = FlowRouter.current().params.id;
        channelHandle = Meteor.subscribe('channels', Session.get('currentOrgId'));
        Meteor.subscribe('subscriptions.byChannel', Session.get('currentOrgId'), channelId);
        Meteor.subscribe('deployableVersions', Session.get('currentOrgId'));
        editMode.set(false);
    });
});

  
Template.channel_details.onRendered( () => {
    const clipboard = new Clipboard('.copy-button');
    clipboard.on('success', function(e) {
        $(e.trigger).tooltip('show');
        e.clearSelection();
        setTimeout(function() {
            $(e.trigger).tooltip('dispose');
        }, 800);
    });
});

Template.channel_details.helpers({
    editMode(id) {
        return id == clickedItem.get() ? true : false;
    },
});

Template.channel_single.helpers({
    channel() {
        const channelId = FlowRouter.current().params.id;
        const chans = Channels.findOne({'org_id': Session.get('currentOrgId'), 'uuid': channelId });
        return chans;
    },
    showNoChannelMessage() {
        const channelId = FlowRouter.current().params.id;
        const channel = Channels.findOne({'org_id': Session.get('currentOrgId'), 'uuid': channelId });
        return channelHandle && channelHandle.ready() && !channel;
    }
});

Template.channel_edit_form.events({
    'click .js-cancel-edit-resource'(e) {
        e.preventDefault();
        editMode.set(false);
        clickedItem.set(null);
    },
    'click .js-update-resource'(e) {
        e.preventDefault();
        const id = Template.currentData().channel.uuid;
        const updatedName = document.getElementById('js-channel-input').value;
        const currentNames = Channels.find({'org_id': Session.get('currentOrgId') }, {fields: {'name': 1} }).fetch();
        if(!updatedName || updatedName.length == 0) {
            $('#js-channel-input').addClass('is-invalid').focus();
            return false;
        }
        
        const existingAppNames = currentNames.map( (item) => item.name );
        if(_.includes(existingAppNames, updatedName)) {
            $('#js-channel-input').addClass('is-invalid').focus();
            return false;
        }
    
        Meteor.call('updateChannel', Session.get('currentOrgId'), id, updatedName, (error) => {
            if(error) {
                toastr.error(error.error, 'Error updating the channel');
            }
        });

        clickedItem.set(null);
        editMode.set(false);
    },
});

Template.channel_details.events({
    'click .js-channel-edit, keypress .js-channel-edit'(e) {
        e.preventDefault();
        const channelId = $(e.currentTarget).data('id');
        clickedItem.set(channelId);
        editMode.set(true);
        return false;
    },
    'click .js-resource-remove, keypress .js-resource-remove'(e){
        e.preventDefault();
        clickedItem.set(null);
        const channelId = Template.currentData().channel.uuid;
        $(`#modal-${channelId}`).modal('show');
        return false;
    },
});


Template.channel_edit_form.onRendered(function() {
    this.find('input').focus();
});


Template.channel_delete_modal.events({
    'click .js-delete-resource-confirm'(e) {
        const $el = $(e.currentTarget);
        const $modal = $el.closest('.modal');
        const channelId = Template.currentData().channel.uuid;
        
        $modal.modal('hide');
        if(channelId) {
            Meteor.call('removeChannel', Session.get('currentOrgId'), channelId, (error)=>{
                if(error) {
                    toastr.error(error.error, `Error removing ${channelId}`);
                } else {
                    FlowRouter.redirect(`/${Session.get('currentOrgName')}/deployables`);
                }
            });
        }

        return false;
    },
});
