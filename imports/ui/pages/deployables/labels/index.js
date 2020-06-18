
import './page.html';
import './page.scss';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Labels } from '/imports/api/deployables/labels/labels.js';
import _ from 'lodash';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

let editMode = new ReactiveVar(false);
let showNewLabelRow = new ReactiveVar(false);

Template.Labels.onCreated(function() {
    this.autorun(()=>{
        Meteor.subscribe('labels', Session.get('currentOrgId'));
        editMode.set(false);
    });
});

Template.Labels.helpers({
    showNewLabelRow() {
        return showNewLabelRow.get();
    },
    labels(){
        const labels = Labels.find({'orgId': Session.get('currentOrgId')}).fetch();
        // get all label owner ids and subscribe.
        const ownerIds = labels.map( (label) => label.owner )
            .filter( (element, index, arr) => index === arr.indexOf(element)) // remove duplicates
            .filter(Boolean);  // remove undefined items from the array
        Meteor.subscribe('users.byIds', ownerIds);
        return labels;        
    },
    buttonStatus() {
        if(editMode.get()) {
            return 'disabled';
        } else {
            return 'enabled';
        }
    },
    owner(id) {
        const user = Meteor.users.findOne({ _id: id });
        if (!user) {
            return '';
        }
        return user.profile.name;
    },
});

Template.Labels.events({
    'click .js-add-label'(e) {
        e.preventDefault();
        const labelName = $(e.target).closest('.group-item-new').find('input[name="groupName"]').val();
        
        if(!labelName|| labelName.length == 0) {
            $(e.target).closest('.group-item-new').find('input[name="groupName"]').addClass('is-invalid').focus();
            return false;
        }

        const labels = Template.Labels.__helpers.get('labels').call();
        const existingGroups = labels.map( (item) => item.name );
        if(_.includes(existingGroups, labelName)) {
            $(e.target).closest('.group-item-new').find('input[name="groupName"]').addClass('is-invalid').focus();
            return false;
        }

        Meteor.call('addLabel', Session.get('currentOrgId'), labelName, (error)=>{
            if(error) {
                toastr.error(error.error, 'Error adding a label');
            }
        });
        showNewLabelRow.set(false);
        editMode.set(false);
        return false;
    },

    'click .js-create-label'(e) {
        if(editMode.get()) {
            return;  //disables the button while rows are being edited
        }
        e.preventDefault();
        
        showNewLabelRow.set(true);
        $(e.target).closest('.group-item-new').find('input[name="groupName"]').focus();
        editMode.set(true);
    },
    'click .js-delete-label-confirm'(e) {
        const $el = $(e.currentTarget);
        const $modal = $el.closest('.modal');
        const $container = $modal.closest('.group-item');
        const labelName = $container.data('name') + '';
        const uuid = $container.data('id') + '';
        $modal.modal('hide');
        if(labelName) {
            Meteor.call('removeLabel', Session.get('currentOrgId'), labelName, uuid,  (error)=>{
                if(error) {
                    toastr.error(error.error, 'Error removing the label');
                }
            });
        }
        return false;
    },
    'click .js-label-remove, keypress .js-label-remove'(e){
        e.preventDefault();
        // prevent the delete modal from displaying when adding/editing a row and using the enter key
        if(showNewLabelRow.get() || editMode.get()) {
            return false;
        }
        var $el = $(e.currentTarget);
        var $modal = $el.siblings('.js-delete-label-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-label-help'(e){
        e.preventDefault();
        var $modal = $('.js-label-help-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-cancel-add-label'(e) {
        e.preventDefault();
        showNewLabelRow.set(false);
        editMode.set(false);
    },
});
