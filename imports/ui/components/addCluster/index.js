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

import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import Clipboard from 'clipboard';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import toastr from 'toastr';

const kubeCommand = new ReactiveVar();
const errorState = new ReactiveVar();

Template.addCluster.onRendered( () => {
    new Clipboard('.copy-button', {
        container: document.getElementById('add-cluster-modal')
    });
});

Template.addCluster.events({
    'click .js-register-cluster'(e) {
        e.preventDefault();
        kubeCommand.set(false);
        errorState.set(false);
        $('#js-new-cluster').removeClass('is-invalid');
        const clusterName = $('#js-new-cluster').val();

        if(!clusterName|| clusterName.length == 0) {
            $('#js-new-cluster').addClass('is-invalid').focus();
            return false;
        }

        Meteor.call('registerCluster', Session.get('currentOrgId'), clusterName,  (error, response)=>{
            if(error) {
                toastr.error(error.error, 'Error adding the channel');
                $('#js-new-cluster').addClass('is-invalid').focus();
                Meteor.setTimeout(function(){
                    errorState.set(error.error);
                }, 100);
                return false;
            } else {
                Meteor.setTimeout(function(){
                    kubeCommand.set(response.data.registerCluster.url);
                }, 100);
                return false;
            }
        });
    }
});

Template.addCluster.helpers({
    kubeCommand() {
        return kubeCommand.get();
    },
    registrationError() {
        return errorState.get();
    },
});