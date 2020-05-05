
import './page.html';
import './page.scss';
import './helpModal.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Channels } from '/imports/api/deployables/channels/channels';
import { DeployableVersions } from '/imports/api/deployables/channels/deployableVersions';

import _ from 'lodash';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

let editMode = new ReactiveVar(false);
let showNewAppRow = new ReactiveVar(false);
let clickedItem = new ReactiveVar(null);
let loading = new ReactiveVar(null);

Template.Channels.onCreated(function() {
    this.autorun(()=>{
        Meteor.subscribe('channels', Session.get('currentOrgId'));
        Meteor.subscribe('deployableVersions', Session.get('currentOrgId'));
        editMode.set(false);
    });
});

Template.Channels.helpers({
    showNewAppRow() {
        return showNewAppRow.get();
    },
    channels(){
        const resources = Channels.find({'org_id': Session.get('currentOrgId')}).fetch();
        return resources;        
    },
    resourceVersions(resourceId) {
        const versions = DeployableVersions.find({'org_id': Session.get('currentOrgId'), 'channel_id': resourceId}).fetch();
        return versions.length || 0; 
    },
    editMode(name) {
        return name == clickedItem.get() ? true : false;
    },
    isLoading() {
        return loading.get();
    },
    buttonStatus() {
        if(editMode.get()) {
            return 'disabled';
        } else {
            return 'enabled';
        }
    },
    clickedItem() {
        return clickedItem.get();
    }
});

Template.Channels.events({
    'click .js-add-resource'(e) {
        e.preventDefault();
        const resourceName = $(e.target).closest('.resource-item-new').find('input[name="resourceName"]').val();

        if(!resourceName|| resourceName.length == 0) {
            $(e.target).closest('.resource-item-new').find('input[name="resourceName"]').addClass('is-invalid').focus();
            return false;
        }

        const resources = Template.Channels.__helpers.get('channels').call();
        const existingAppNames = resources.map( (item) => item.name );
        if(_.includes(existingAppNames, resourceName)) {
            $(e.target).closest('.resource-item-new').find('input[name="resourceName"]').addClass('is-invalid').focus();
            return false;
        }

        Meteor.call('addChannel', Session.get('currentOrgId'), resourceName,  (error)=>{
            if(error) {
                console.log(error);
                toastr.error('Error adding a resource', error.message);
            } 
        });
        showNewAppRow.set(false);
        editMode.set(false);
        return false;
    },
    'click .js-create-resource'(e) {
        e.preventDefault();
        showNewAppRow.set(true);
        $(e.target).closest('.resource-item-new').find('input[name="resourceName"]').focus();
        editMode.set(true);
    },
    'click .js-delete-resource-confirm'(e) {
        const $el = $(e.currentTarget);
        const $modal = $el.closest('.modal');
        const $container = $modal.closest('.resource-item');
        const resourceName = $container.data('name') + '';
        const resourceId = $container.data('id') + '';
        $modal.modal('hide');
        if(resourceName) {
            Meteor.call('removeChannel', Session.get('currentOrgId'), resourceName, resourceId, (error)=>{
                if(error) {
                    toastr.error(`Error removing the resource ${resourceName}`, error.message);
                }
            });
        }
        return false;
    },
    'click .js-resource-remove, keypress .js-resource-remove'(e){
        e.preventDefault();
        // prevent the delete modal from displaying when adding/editing a row and using the enter key
        if(showNewAppRow.get() || editMode.get()) {
            return false;
        }
        clickedItem.set(null);
        var $el = $(e.currentTarget);
        var $modal = $el.siblings('.js-delete-resource-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-resource-help'(e){
        e.preventDefault();
        clickedItem.set(null);
        var $modal = $('.js-resource-help-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-cancel-add-resource'(e) {
        e.preventDefault();
        showNewAppRow.set(false);
        editMode.set(false);
    },
    'click .js-cancel-edit-resource'(e) {
        e.preventDefault();
        editMode.set(false);
        clickedItem.set(null);
    },
    'click .js-update-resource'(e) {
        e.preventDefault();
        const appId = $(e.target).closest('.resource-item-edit').data('id');
        const updatedName = $(e.target).closest('.resource-item-edit').find('input[name="resourceName"]').val();

        if(!updatedName || updatedName.length == 0) {
            $(e.target).closest('.resource-item-edit').find('input[name="resourceName"]').addClass('is-invalid').focus();
            return false;
        }

        const resources = Template.Channels.__helpers.get('channels').call();
        const existingAppNames = resources.map( (item) => item.name );
        if(clickedItem.get() !== updatedName && _.includes(existingAppNames, updatedName)) {
            $(e.target).closest('.resource-item-edit').find('input[name="resourceName"]').addClass('is-invalid').focus();
            return false;
        }
        
        Meteor.call('updateChannel', Session.get('currentOrgId'), appId, updatedName, (error) => {
            if(error) {
                toastr.error('Error updating the resource', error.message);
            }
        });

        clickedItem.set(null);
        editMode.set(false);
    },
    'click .resource-edit, keypress .resource-edit'(e) {
        e.preventDefault();
        const clickedRow = $(e.target).closest('.resource-item').data('name');
        clickedItem.set(clickedRow);
        editMode.set(true);
        return false;
    },
});
