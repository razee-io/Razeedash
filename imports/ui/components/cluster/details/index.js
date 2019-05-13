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
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

Template.cluster_info.onCreated(function(){
    this.hasCopied = new ReactiveVar(false);
});
Template.cluster_info.helpers({
    hasCopied(){
        return Template.instance().hasCopied.get();
    },
});
Template.cluster_info.events({
    'click .copyGpgPublicKeyBtn'(e){
        var $el = $(e.currentTarget).closest('.copyGpgPublicKeyBtn');
        var $formGroup = $el.closest('.form-group');
        var $textarea = $formGroup.find('textarea');
        $textarea.get(0).select();
        document.execCommand('copy');
        Template.instance().hasCopied.set(true);
    },
});
