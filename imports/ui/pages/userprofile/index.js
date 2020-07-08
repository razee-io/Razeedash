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

import './page.scss';	
import './page.html';	
import { Meteor } from 'meteor/meteor';	
import { Template } from 'meteor/templating';	
import toastr from 'toastr';

Template.UserProfile_home.events({	
    'click .js-key-btn': function(e) {	
        e.preventDefault();	
        const $modal = $('#js-key-modal');	
        $modal.modal('show');
        return false;
    },
    'click .js-key-modal-confirm': function() {	
        const $modal = $('#js-key-modal');	
        Meteor.call('generateApikey', (error)=> {
            if(error) {
                toastr.error(error.message, 'Error creating an api key');
                console.error(error);
            }
        });
        $modal.modal('hide');
        return false;
    }	
});	

Template.UserProfile_home.onCreated(function() {	
    this.autorun(() => {	
        this.subscribe('userData');	
    });	
});
