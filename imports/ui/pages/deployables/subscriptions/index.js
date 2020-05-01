
import './page.html';
import './page.scss';
import './helpModal.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Subscriptions } from '/imports/api/deployables/subscriptions/subscriptions.js';
import { Channels } from '/imports/api/deployables/channels/channels.js';
import { DeployableVersions } from '/imports/api/deployables/channels/deployableVersions.js';
import _ from 'lodash';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

let editMode = new ReactiveVar(false);
let showNewGroupRow = new ReactiveVar(false);
let clickedItem = new ReactiveVar(null);

Template.Subscriptions.onCreated(function() {
    this.selectedChannel = new ReactiveVar(null);
    this.autorun(()=>{
        Meteor.subscribe('subscriptions', Session.get('currentOrgId'));
        Meteor.subscribe('channels', Session.get('currentOrgId'));
        editMode.set(false);
    });
});

// stolen from razeeapi
const tagsStrToArr = (str)=>{
    var tags = [];
    if(_.isString(str)){
        tags = str.split(/,/);
    }
    else if(_.isArray(str)){
        tags = str;
    }
    else{
        throw `invalid input type "${typeof str}"`;
    }
    tags = _.map(tags, _.trim);
    tags = _.filter(tags);
    return tags;
};

Template.Subscriptions.helpers({
    canEdit() {
        return editMode.get() ? 'disabled' : '';
    },
    tags(subscription) {
        return tagsStrToArr(subscription.tags);
    },
    showNewGroupRow() {
        return showNewGroupRow.get();
    },
    subscriptions(){
        const groups = Subscriptions.find({'org_id': Session.get('currentOrgId')}).fetch();

        // get all subscription owner ids and subscribe.
        const ownerIds = groups.map( (sub) =>  sub.owner )
            .filter( (element, index, arr) => index === arr.indexOf(element)) // remove duplicates
            .filter(Boolean);  // remove undefined items from the array
        Meteor.subscribe('users.byIds', ownerIds);

        return groups;        
    },
    editMode(name) {
        return name == clickedItem.get() ? true : false;
    },
    buttonStatus() {
        if(editMode.get()) {
            return 'disabled';
        } else {
            return 'enabled';
        }
    },
    selectStatus() {
        return editMode.get() ? 'enabled' : 'disabled';
    },
    clickedItem() {
        return clickedItem.get();
    },
    channels(){
        return Channels.find({'org_id': Session.get('currentOrgId')}).fetch();
    },
    selectedChannel() {
        return Template.instance().selectedChannel.get();
    },
    currentChannel(channel, id) {
        const subscriptions = Subscriptions.find({'org_id': Session.get('currentOrgId'), 'uuid': id}).fetch();
        return (channel.name === subscriptions[0].channel) ? 'selected': '';
    },
    currentVersion(version, id) {
        const subscriptions = Subscriptions.find({'org_id': Session.get('currentOrgId'), 'uuid': id}).fetch();
        if(subscriptions && subscriptions[0]) {
            return (version.name == subscriptions[0].version) ? 'selected': '';
        } else {
            return '';
        }
    },
    getVersions(channel) {
        if(!channel) {
            const channels = Template.Subscriptions.__helpers.get('channels').call();
            if(channels && channels.length > 0) {
                Template.instance().selectedChannel.set(channels[0].name);
            }
        }
        let versions = DeployableVersions.find({'org_id': Session.get('currentOrgId'), 'channel_name': channel}).fetch();
        return versions;
    },
    owner(id) {
        const user = Meteor.users.findOne({ _id: id });
        if (!user) {
            return '';
        }
        return user.profile.name;
    },
});

Template.Subscriptions.events({
    'change select.resource-dropdown'(event, instance) {
        const currentTarget = event.currentTarget;
        const channelName = currentTarget.options[currentTarget.selectedIndex].label;
        instance.selectedChannel.set(channelName);
    },
    'click .js-add-group'(e, instance) {
        e.preventDefault();
        const groupName = $(e.target).closest('.group-item-new').find('input[name="groupName"]').val();
        const groupTags = $(e.target).closest('.group-item-new').find('input[name="groupTags"]').val().split(/[ ,]+/).filter(String);
        const resourceId = $(e.target).closest('.group-item-new').find('.resource-dropdown').val();
        const resourceName = instance.selectedChannel.get();
        const resourceVersion = $(e.target).closest('.group-item-new').find('.version-dropdown').val();
        const resourceVersionName = $(e.target).closest('.group-item-new').find('.version-dropdown option:selected').text();

        if(!groupName|| groupName.length == 0) {
            $(e.target).closest('.group-item-new').find('input[name="groupName"]').addClass('is-invalid').focus();
            return false;
        }
        if(!groupTags|| groupTags.length == 0) {
            $(e.target).closest('.group-item-new').find('input[name="groupTags"]').addClass('is-invalid').focus();
            return false;
        }
        if(!resourceName) {
            $(e.target).closest('.group-item-new').find('.resource-dropdown').addClass('is-invalid').focus();
            return false;
        }
        if(!resourceVersion) {
            $(e.target).closest('.group-item-new').find('.version-dropdown').addClass('is-invalid').focus();
            return false;
        }
        
        const gropus = Template.Subscriptions.__helpers.get('subscriptions').call();
        const existingGroups = gropus.map( (item) => item.name );
        if(_.includes(existingGroups, groupName)) {
            $(e.target).closest('.group-item-new').find('input[name="groupName"]').addClass('is-invalid').focus();
            return false;
        }

        Meteor.call('addSubscription', Session.get('currentOrgId'), groupName, groupTags, resourceId, resourceName, resourceVersion, resourceVersionName, (error)=>{
            if(error) {
                toastr.error('Error adding a subscription', error.message);
            }
            Meteor.call('updateResourceStats', Session.get('currentOrgId'));
        });
        showNewGroupRow.set(false);
        editMode.set(false);
        Template.instance().selectedChannel.set(null);
        return false;
    },

    'click .js-select-verision-btn, keypress .js-select-version-btn'(e){
        e.preventDefault();
        // prevent the delete modal from displaying when adding/editing a row and using the enter key
        if(showNewGroupRow.get() || editMode.get()) {
            return false;
        }
        clickedItem.set(null);
        return false;
    },
    'click .js-create-group'(e) {
        if(editMode.get()) {
            return;  //disables the button while rows are being edited
        }
        e.preventDefault();
        showNewGroupRow.set(true);
        $(e.target).closest('.group-item-new').find('input[name="groupName"]').focus();
        editMode.set(true);
    },
    'click .js-delete-group-confirm'(e) {
        const $el = $(e.currentTarget);
        const $modal = $el.closest('.modal');
        const $container = $modal.closest('.group-item');
        const groupName= $container.data('name') + '';
        const uuid = $container.data('id') + '';
        $modal.modal('hide');
        if(groupName) {
            Meteor.call('removeSubscription', Session.get('currentOrgId'), groupName, uuid, (error)=>{
                if(error) {
                    toastr.error(`Error removing the subscription ${groupName}`, error.message);
                }
                Meteor.call('updateResourceStats', Session.get('currentOrgId'));
            });
        }
        return false;
    },
    'click .js-group-remove, keypress .js-group-remove'(e){
        e.preventDefault();
        // prevent the delete modal from displaying when adding/editing a row and using the enter key
        if(showNewGroupRow.get() || editMode.get()) {
            return false;
        }
        clickedItem.set(null);
        var $el = $(e.currentTarget);
        var $modal = $el.siblings('.js-delete-group-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-group-help'(e){
        e.preventDefault();
        clickedItem.set(null);
        var $modal = $('.js-group-help-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-cancel-add-group'(e) {
        e.preventDefault();
        showNewGroupRow.set(false);
        Template.instance().selectedChannel.set(null);
        editMode.set(false);
    },
    'click .js-cancel-edit-group'(e) {
        e.preventDefault();
        editMode.set(false);
        Template.instance().selectedChannel.set(null);
        clickedItem.set(null);
    },
    'click .js-update-group'(e) {
        e.preventDefault();
        const groupId = $(e.target).closest('.group-item-edit').data('id');
        const updatedName = $(e.target).closest('.group-item-edit').find('input[name="groupName"]').val();
        const updatedTags = $(e.target).closest('.group-item-edit').find('input[name="groupTags"]').val().split(/[ ,]+/).filter(String);
        const resourceId = $(e.target).closest('.group-item-edit').find('.resource-dropdown').val();
        const resourceName = $(e.target).closest('.group-item-edit').find('.resource-dropdown option:selected').text();
        const resourceVersion = $(e.target).closest('.group-item-edit').find('.version-dropdown').val();
        const resourceVersionName = $(e.target).closest('.group-item-edit').find('.version-dropdown option:selected').text();

        if(!updatedName || updatedName.length == 0) {
            $(e.target).closest('.group-item-edit').find('input[name="groupName"]').addClass('is-invalid').focus();
            return false;
        }

        const groups = Template.Subscriptions.__helpers.get('subscriptions').call();
        const existingGroupNames = groups.map( (item) => item.name );
        if(clickedItem.get() !== updatedName && _.includes(existingGroupNames, updatedName)) {
            $(e.target).closest('.group-item-edit').find('input[name="groupName"]').addClass('is-invalid').focus();
            return false;
        }

        if(!resourceName) {
            $(e.target).closest('.group-item-edit').find('.resource-dropdown').addClass('is-invalid').focus();
            return false;
        }
        if(!resourceVersion) {
            $(e.target).closest('.group-item-edit').find('.version-dropdown').addClass('is-invalid').focus();
            return false;
        }
        
        Meteor.call('updateSubscription', Session.get('currentOrgId'), groupId, updatedName, updatedTags, resourceId, resourceName, resourceVersion, resourceVersionName, (error) => {
            if(error) {
                toastr.error('Error updating the subscription', error.message);
            }
        });

        Template.instance().selectedChannel.set(null);
        clickedItem.set(null);
        editMode.set(false);
    },
    'click .group-edit, keypress .group-edit'(e) {
        e.preventDefault();
        const clickedRow = $(e.target).closest('.group-item').data('name');
        const channelName = $(e.target).closest('.group-item').data('channel');
        clickedItem.set(clickedRow);
        editMode.set(true);
        Template.instance().selectedChannel.set(channelName);
        return false;
    },
});
