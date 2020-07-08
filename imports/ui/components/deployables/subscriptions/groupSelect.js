
import './groupSelect.html';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import toastr from 'toastr';
// eslint-disable-next-line no-unused-vars
import selectpicker from 'bootstrap-select';

Template.GroupSelect.onRendered( function() {
    $('.js-group-select').selectpicker();
});

Template.ddmenu.events({
    'click .js-add-group'(e) {
        e.preventDefault();
        const groupName = $('#js-new-group').val();
        
        if(!groupName|| groupName.length == 0) {
            $(e.target).closest('.group-item-new').find('input[name="groupName"]').addClass('is-invalid').focus();
            return false;
        }

        Meteor.call('addGroup', Session.get('currentOrgId'), groupName, (error)=>{
            if(error) {
                toastr.error(error.error, 'Error adding a cluster group');
            }
            Meteor.setTimeout(()=> {
                $('.js-group-select').selectpicker('refresh');
                $('.js-group-select').selectpicker('val', groupName);
            }, 100);
        });
        return false;
    },
});

Template.GroupOption.helpers({
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

Template.NoGroups.events({
    'click .js-add-new-group'(e){
        e.preventDefault();
        var $modal = $('.js-add-group-modal');
        $modal.modal('show');
        return false;
    },
});
