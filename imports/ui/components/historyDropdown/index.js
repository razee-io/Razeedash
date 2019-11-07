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
import { Template } from 'meteor/templating';

Template.history_dropdown.onRendered(function() {
    $(function() {
        $('[data-toggle="tooltip"]').tooltip();
    });
});

Template.history_dropdown.helpers({
    getColoredIcon(s) {
        let total = s.hash.s.total;
    
        if (typeof total === 'number') {
            if (total <= 25) {
                return 'fa fa-thermometer-0 fa-lg';
            } else if (total > 25 && total <= 75) {
                return 'fa fa-thermometer-2 fa-lg';
            } else {
                return 'fa fa-thermometer-4 fa-lg';
            }
        }
    },
    getColorIndicator(s) {
        let total = s.hash.s.total;

        if (typeof total === 'number') {
            if (total <= 25) {
                return 'color:green;';
            } else if (total > 25 && total <= 75) {
                return 'color:orange;';
            } else {
                return 'color:red;';
            }
        }
    },
    resourcePathQueryObj(){
        return {selfLink: this.resource.selfLink};
    },
    timestampToDateObj(timestamp){
        return new Date(timestamp);
    },
});
