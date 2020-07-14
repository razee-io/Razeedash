
import './component.html';
import './helpModal.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Subscriptions } from '/imports/api/deployables/subscriptions/subscriptions.js';
import { Groups } from '/imports/api/deployables/groups/groups.js';
import { Channels } from '/imports/api/deployables/channels/channels.js';
import { DeployableVersions } from '/imports/api/deployables/channels/deployableVersions.js';
import _ from 'lodash';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';
import { FlowRouter } from 'meteor/kadira:flow-router';

let editMode = new ReactiveVar(false);
let showNewRow = new ReactiveVar(false);
let clickedItem = new ReactiveVar(null);

Template.Subscriptions.onCreated(function() {
    this.autorun(()=>{
        const channelId = FlowRouter.current().params.id;
        Meteor.subscribe('subscriptions.byChannel', Session.get('currentOrgId'), channelId);
        Meteor.subscribe('channels', Session.get('currentOrgId'));
        Meteor.subscribe('deployableVersions', Session.get('currentOrgId'));
        Meteor.subscribe('groups', Session.get('currentOrgId'));
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
        if(subscription.groups) {
            return tagsStrToArr(subscription.groups);
        }
    },
    showNewRow() {
        return showNewRow.get();
    },
    groups(){
        return Groups.find({'org_id': Session.get('currentOrgId')}).fetch();
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
    selectStatus() {
        return editMode.get() ? 'enabled' : 'disabled';
    },
    clickedItem() {
        return clickedItem.get();
    },
    channels(){
        return Channels.find({'org_id': Session.get('currentOrgId')}).fetch();
    },
    currentVersion(version, id) {
        const subscriptions = Subscriptions.find({'org_id': Session.get('currentOrgId'), 'uuid': id}).fetch();
        if(subscriptions && subscriptions[0]) {
            return (version.name == subscriptions[0].version) ? 'selected': '';
        } else {
            return '';
        }
    },
    getVersions() {
        const channelId = FlowRouter.current().params.id;
        let versions = DeployableVersions.find({'org_id': Session.get('currentOrgId'), 'channel_id': channelId}).fetch();
        return versions;
    },
});

Template.SusbscriptionActions.events({
    'click .js-subscription-remove, keypress .js-subscription-remove'(e){
        e.preventDefault();
        const id = $(e.target).data('id') + '';
        var $modal = $(`.js-delete-group-modal#${id}`);
        $modal.modal('show');
        return false;
    },
});

Template.Subscriptions.events({
    'click .js-groups-link'(e){
        // console.log('clicked js-groups-link');
        // console.log(e.target);
        // prevent the modal from displaying when adding/editing a row and using the enter key
        // if(showNewRow.get() || editMode.get()) {
        //     return false;
        // }
        // if($(e.currentTarget).hasClass('js-groups-link')) {
        //   return false;
        // }
        // console.log(e.currentTarget);
        // var $el = $(e.currentTarget).hasClass('js-groups-link');
        e.preventDefault();
        var $modal = $('.js-add-group-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-add-subscription'(e) {
        e.preventDefault();
        const channelId = FlowRouter.current().params.id;
        const subscriptionName = $(e.target).closest('.js-new-subscription').find('input[name="subscriptionName"]').val();
        const clusterGroups = $(e.target).closest('.js-new-subscription').find('select.js-group-select').val();
        const resourceVersion = $(e.target).closest('.js-new-subscription').find('.version-dropdown').val();

        if(!subscriptionName|| subscriptionName.length == 0) {
            $(e.target).closest('.js-new-subscription').find('input[name="subscriptionName"]').addClass('is-invalid').focus();
            return false;
        }
        if(!clusterGroups|| clusterGroups.length == 0) {
            $(e.target).closest('.js-new-subscription').find('.select.js-group-select').addClass('is-invalid').focus();
            return false;
        }
        if(!resourceVersion) {
            $(e.target).closest('.js-new-subscription').find('.version-dropdown').addClass('is-invalid').focus();
            return false;
        }
        
        const subs = Template.Subscriptions.__helpers.get('subscriptions').call();
        const existingSubs = subs.map( (item) => item.name );
        if(_.includes(existingSubs, subscriptionName)) {
            $(e.target).closest('.js-new-subscription').find('input[name="subscriptionName"]').addClass('is-invalid').focus();
            return false;
        }

        Meteor.call('addSubscription', Session.get('currentOrgId'), subscriptionName, clusterGroups, channelId, resourceVersion, (error)=>{
            if(error) {
                toastr.error(error.error, 'Error adding a subscription');
            }
            Meteor.call('updateResourceStats', Session.get('currentOrgId'));
        });
        showNewRow.set(false);
        editMode.set(false);
        return false;
    },
    'click .js-select-verision-btn, keypress .js-select-version-btn'(e){
        e.preventDefault();
        // prevent the delete modal from displaying when adding/editing a row and using the enter key
        if(showNewRow.get() || editMode.get()) {
            return false;
        }
        clickedItem.set(null);
        return false;
    },
    'click .js-create-subscription'(e) {
        if(editMode.get()) {
            return;  //disables the button while rows are being edited
        }
        e.preventDefault();
        showNewRow.set(true);
        $(e.target).closest('.js-new-subscription').find('input[name="subscriptionName"]').focus();
        editMode.set(true);
    },
    'click .js-delete-subscription-confirm'(e) {
        const $el = $(e.currentTarget);
        const $modal = $el.closest('.modal');
        const $container = $modal.closest('.group-item');
        const subscriptionName= $container.data('name') + '';
        const uuid = $container.data('id') + '';
        $modal.modal('hide');
        if(subscriptionName) {
            Meteor.call('removeSubscription', Session.get('currentOrgId'), subscriptionName, uuid, (error)=>{
                if(error) {
                    toastr.error(error.error, 'Error removing the subscription');
                }
                Meteor.call('updateResourceStats', Session.get('currentOrgId'));
            });
        }
        return false;
    },
    'click .js-subscription-remove, keypress .js-subscription-remove'(e){
        e.preventDefault();
        // prevent the delete modal from displaying when adding/editing a row and using the enter key
        if(showNewRow.get() || editMode.get()) {
            return false;
        }
        clickedItem.set(null);
        var $el = $(e.currentTarget);
        var $modal = $el.siblings('.js-delete-group-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-subscription-help'(e){
        e.preventDefault();
        clickedItem.set(null);
        var $modal = $('.js-subscription-help-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-cancel-add-subscription'(e) {
        e.preventDefault();
        showNewRow.set(false);
        editMode.set(false);
    },
    'click .js-cancel-edit-subscription'(e) {
        e.preventDefault();
        editMode.set(false);
        clickedItem.set(null);
    },
    'click .js-update-subscription'(e) {
        e.preventDefault();
        const channelId = FlowRouter.current().params.id;
        const subscriptionId = $(e.target).closest('.js-subscription-edit').data('id');
        const updatedName = $(e.target).closest('.js-subscription-edit').find('input[name="subscriptionName"]').val();
        const updatedGroups = $(e.target).closest('.js-subscription-edit').find('select.js-group-select').val();
        const resourceVersion = $(e.target).closest('.js-subscription-edit').find('.version-dropdown').val();

        if(!updatedName || updatedName.length == 0) {
            $(e.target).closest('.js-subscription-edit').find('input[name="subscriptionName"]').addClass('is-invalid').focus();
            return false;
        }

        if(!updatedGroups || updatedGroups.length == 0) {
            $(e.target).closest('.js-subscription-edit').find('.js-group-select').addClass('is-invalid').focus();
            return false;
        }

        const subs = Template.Subscriptions.__helpers.get('subscriptions').call();
        const existingSubs = subs.map( (item) => item.name );
        if(clickedItem.get() !== updatedName && _.includes(existingSubs, updatedName)) {
            $(e.target).closest('.js-subscription-edit').find('input[name="subscriptionName"]').addClass('is-invalid').focus();
            return false;
        }

        if(!resourceVersion) {
            $(e.target).closest('.js-subscription-edit').find('.version-dropdown').addClass('is-invalid').focus();
            return false;
        }
        
        Meteor.call('updateSubscription', Session.get('currentOrgId'), subscriptionId, updatedName, updatedGroups, channelId, resourceVersion, (error) => {
            if(error) {
                toastr.error(error.error, 'Error updating the subscription');
            }
        });

        clickedItem.set(null);
        editMode.set(false);
    },
    'click .js-set-edit-mode, keypress .js-set-edit-mode'(e) {
        e.preventDefault();
        const clickedRow = $(e.target).closest('.group-item').data('name');
        clickedItem.set(clickedRow);
        editMode.set(true);
        return false;
    },
});
