
import './groupSelect.html';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
// eslint-disable-next-line no-unused-vars
import selectpicker from 'bootstrap-select';

Template.group_select.onRendered( function() {
    $('.js-group-select').selectpicker();
});
Template.group_select.onCreated( function() {
    this.autorun(()=>{
        Meteor.subscribe('groups', Session.get('currentOrgId'));
    });
});

Template.group_select.events({
    'click .js-add-new-group'(e){
        e.preventDefault();
        var $modal = $('.js-add-group-modal');
        $modal.modal('show');
        return false;
    },
});

Template.group_option.helpers({
    selectStatus() {
    // when editing a subscription, this puts checks on the 
    // items in the dropdown that are already selected
        let selected = '';
        if(this.subscription && this.subscription.groups) {
            this.subscription.groups.map( (group) => {
                if(group === this.group.name) {
                    selected='selected';
                } 
            });
        }
        return selected;
    },
});
