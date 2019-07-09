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

import './page.html';
import './page.scss';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Orgs } from '/imports/api/org/orgs';
import Clipboard from 'clipboard';
import _ from 'lodash';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

Template.OrgSingle.onCreated( () => {
    const template = Template.instance();
    template.autorun(()=>{
        var orgName = FlowRouter.getParam('baseOrgName');
        template.orgName = orgName;
        template.org = Orgs.findOne({ name: orgName, });

        var creatorId = Template.OrgSingle.__helpers.get('creatorId').call(Template.instance());
        if(creatorId){
            Meteor.subscribe('users.byId', creatorId);
        }
    });
});

Template.OrgSingle.onRendered( () => {
    new Clipboard('.copy-button');
});

Template.OrgSingle.helpers({
    creatorId(){
        var org = Template.OrgSingle.__helpers.get('org').call(Template.instance());
        return _.get(org, 'creatorUserId', null);
    },
    creatorNameAndId(){
        var creatorId = Template.OrgSingle.__helpers.get('creatorId').call(Template.instance());
        var user = Meteor.users.findOne({ _id: creatorId });
        var userName = _.get(user, 'profile.name');
        return userName ? `${userName} (${creatorId})` : creatorId;
    },
    org(){
        return Orgs.findOne({ name: Template.instance().orgName });
    },
});


var availableKinds = new ReactiveVar([]);
var loadedKinds = new ReactiveVar(false);
var customSearchableAttrsObj = new ReactiveVar(null);
var hasChanges = new ReactiveVar(false);

Template.OrgManageSearchableAttrs.onCreated(function(){
    this.autorun(()=>{
        var instance = Template.instance();
        loadedKinds.set(false);
        Meteor.call('getResourceKindsForOrg', Session.get('currentOrgId'), (err, data)=>{
            loadedKinds.set(true);
            availableKinds.set(data);
            hasChanges.set(false);
            var customSearchableAttrs = _.cloneDeep(_.get(instance, 'data.org.customSearchableAttrs', {}));
            customSearchableAttrsObj.set(customSearchableAttrs);
        });
    });
    this.autorun(()=>{
        // updates hasChanges
        var originalCustomSearchableAttrs = Template.currentData().org.customSearchableAttrs;
        hasChanges.set(!_.isEqual(originalCustomSearchableAttrs, customSearchableAttrsObj.get()));
    });
});
Template.OrgManageSearchableAttrs.helpers({
    hasChanges(){
        return hasChanges.get();
    },
    loadedKinds(){
        return loadedKinds.get();
    },
    org(){
        return Template.instance().data.org;
    },
    availableKinds(){
        return availableKinds.get();
    },
    usedKinds(){
        return _.keys(customSearchableAttrsObj.get());
    },
    kindIsUsed(kind){
        var usedKinds = Template.OrgManageSearchableAttrs.__helpers.get('usedKinds').call(Template.instance());
        return _.includes(usedKinds, kind);
    },
    hasAnyUsedKinds(){
        var usedKinds = Template.OrgManageSearchableAttrs.__helpers.get('usedKinds').call(Template.instance());
        return (usedKinds.length > 0);
    },
    saveBtnDisabledAttr(){
        var hasChanges = Template.OrgManageSearchableAttrs.__helpers.get('hasChanges').call(Template.instance());
        return (hasChanges ? '' : 'disabled');
    },
    attrsUsedForKind(kind){
        return _.get(customSearchableAttrsObj.get(), `['${kind}']`, []);
    },
    exampleAttrPaths(){
        return [
            'metadata.name',
            'metadata.namespace',
            'spec.template.spec.containers[0].image',
            'metadata.annotations["deployment.kubernetes.io/revision"]',
        ];
    },
});

Template.OrgManageSearchableAttrs.events({
    'click .trackBtn'(e){
        var $el = $(e.currentTarget);
        var $kind = $el.closest('.input-group').find('.trackKindDropdown');
        var kind = $kind.val();
        var obj = customSearchableAttrsObj.get();
        obj[kind] = obj[kind] || [];
        customSearchableAttrsObj.set(obj);
    },
    'click .removeAttrPathBtn'(e){
        var $el = $(e.currentTarget);
        var $container = $el.closest('.attrPathContainer');
        var kind = $container.attr('kind');
        var idx = $container.attr('idx');
        idx = (idx == 'new' ? -1 :  parseInt(idx));

        if(idx == -1){
            $el.val('');
            return;
        }

        var obj = customSearchableAttrsObj.get();
        obj[kind].splice(idx, 1);
        customSearchableAttrsObj.set(obj);
    },
    'change .attrPathItem'(e){
        var $el = $(e.currentTarget);
        var $container = $el.closest('.attrPathContainer');
        var val = $el.val();
        var kind = $container.attr('kind');
        var idx = $container.attr('idx');
        idx = (idx == 'new' ? -1 :  parseInt(idx));

        var obj = customSearchableAttrsObj.get();

        if(idx == -1){ //new attr
            obj[kind].push(val);
            $el.val('');
        }
        else{
            obj[kind][idx] = val;
        }
        customSearchableAttrsObj.set(obj);
    },
    'click .saveBtn'(){
        var attrObj = customSearchableAttrsObj.get();
        Meteor.call('saveCustomSearchableAttrsObj', Session.get('currentOrgId'), attrObj, ()=>{
        });
    },
});


