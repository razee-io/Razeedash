/**
* Copyright 2019 IBM Corp. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

import './component.html';
import './component.scss';
import './helpModal.html';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ExternalApplications } from '/imports/api/externalApplications/externalApplications';
import _ from 'lodash';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

let editMode = new ReactiveVar(false);
let showNewAppRow = new ReactiveVar(false);
let clickedItem = new ReactiveVar(null);

Template.MagageExternalApps.onCreated(function() {
    this.autorun(()=>{
        Meteor.subscribe('externalApplications', Session.get('currentOrgId'));
        editMode.set(false);
    });
});
Template.MagageExternalApps.helpers({
    showNewAppRow() {
        return showNewAppRow.get();
    },
    externalApps(){
        const apps = ExternalApplications.find({'org_id': Session.get('currentOrgId')}).fetch();
        return apps;        
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
    clickedItem() {
        return clickedItem.get();
    }
});

Template.MagageExternalApps.events({
    'click .js-add-app'(e) {
        e.preventDefault();
        const appName = $(e.target).closest('.app-item-new').find('input[name="appName"]').val();
        const url = $(e.target).closest('.app-item-new').find('input[name="appLink"]').val();
        const nameMatch = $(e.target).closest('.app-item-new').find('input[name="nameMatch"]').val();
        const kindMatch = $(e.target).closest('.app-item-new').find('input[name="kindMatch"]').val();

        if(!appName|| appName.length == 0) {
            $(e.target).closest('.app-item-new').find('input[name="appName"]').addClass('is-invalid').focus();
            return false;
        }

        if(!url || url.length == 0) {
            $(e.target).closest('.app-item-new').find('input[name="appLink"]').addClass('is-invalid').focus();
            return false;
        }

        const apps = Template.MagageExternalApps.__helpers.get('externalApps').call();
        const existingAppNames = apps.map( (item) => item.name );
        if(_.includes(existingAppNames, appName)) {
            $(e.target).closest('.app-item-new').find('input[name="appName"]').addClass('is-invalid').focus();
            return false;
        }

        Meteor.call('addApplication', Session.get('currentOrgId'), appName, url, nameMatch, kindMatch, (error)=>{
            if(error) {
                toastr.error('Error adding a new application', error);
            }
        });
        showNewAppRow.set(false);
        editMode.set(false);
        return false;
    },
    'click .js-create-app'(e) {
        e.preventDefault();
        showNewAppRow.set(true);
        $(e.target).closest('.app-item-new').find('input[name="appName"]').focus();
        editMode.set(true);
    },
    'click .js-delete-app-confirm'(e) {
        const $el = $(e.currentTarget);
        const $modal = $el.closest('.modal');
        const $container = $modal.closest('.app-item');
        const appName= $container.data('name') + '';
        $modal.modal('hide');
        if(appName) {
            Meteor.call('removeApplication', Session.get('currentOrgId'), appName, (error)=>{
                if(error) {
                    toastr.error(`Error removing the application ${appName}`, error);
                }
            });
        }
        return false;
    },
    'click .js-app-remove, keypress .js-app-remove'(e){
        e.preventDefault();
        // prevent the delete modal from displaying when adding/editing a row and using the enter key
        if(showNewAppRow.get() || editMode.get()) {
            return false;
        }
        clickedItem.set(null);
        var $el = $(e.currentTarget);
        var $modal = $el.siblings('.js-delete-app-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-app-help'(e){
        e.preventDefault();
        clickedItem.set(null);
        var $modal = $('.js-app-help-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-cancel-add'(e) {
        e.preventDefault();
        showNewAppRow.set(false);
        editMode.set(false);
    },
    'click .js-cancel-edit'(e) {
        e.preventDefault();
        editMode.set(false);
        clickedItem.set(null);
    },
    'click .js-update-app'(e) {
        e.preventDefault();
        const appId = $(e.target).closest('tr').data('id');
        const updatedName = $(e.target).closest('.app-item-edit').find('input[name="appName"]').val();
        const updatedLink = $(e.target).closest('.app-item-edit').find('input[name="appLink"]').val();
        const updatedNameMatch = $(e.target).closest('.app-item-edit').find('input[name="nameMatch"]').val();
        const updatedKindMatch = $(e.target).closest('.app-item-edit').find('input[name="kindMatch"]').val();

        if(!updatedName || updatedName.length == 0) {
            $(e.target).closest('.app-item-edit').find('input[name="appName"]').addClass('is-invalid').focus();
            return false;
        }

        if(!updatedLink || updatedLink.length == 0) {
            $(e.target).closest('.app-item-edit').find('input[name="appLink"]').addClass('is-invalid').focus();
            return false;
        }

        const apps = Template.MagageExternalApps.__helpers.get('externalApps').call();
        const existingAppNames = apps.map( (item) => item.name );
        if(clickedItem.get() !== updatedName && _.includes(existingAppNames, updatedName)) {
            $(e.target).closest('.app-item-edit').find('input[name="appName"]').addClass('is-invalid').focus();
            return false;
        }
        
        Meteor.call('updateApplication', Session.get('currentOrgId'), appId, updatedName, updatedLink, updatedNameMatch, updatedKindMatch, (error) => {
            if(error) {
                toastr.error('Error updating the application', error);
            }
        });

        clickedItem.set(null);
        editMode.set(false);
    },
    'click td.app-edit, keypress td.app-edit'(e) {
        e.preventDefault();
        const clickedRow = $(e.target).closest('tr').data('name');
        clickedItem.set(clickedRow);
        editMode.set(true);
        return false;
    },
});
