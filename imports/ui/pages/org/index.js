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
import { loginType } from '/imports/api/lib/login.js';

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
    orgName(){
        return FlowRouter.getParam('baseOrgName');
    },
    orgType() {
        return loginType() === 'bitbucket' ? 'Team' : 'Organization';
    }
});


var availableKinds = new ReactiveVar([]);
var loadedKinds = new ReactiveVar(false);
var customSearchableAttrsObj = new ReactiveVar(null);
var changesTracker = new ReactiveVar();

Template.OrgManageSearchableAttrs.onCreated(function(){
    this.autorun(()=>{
        var instance = Template.instance();
        loadedKinds.set(false);
        Meteor.call('getResourceKindsForOrg', Session.get('currentOrgId'), (err, data)=>{
            loadedKinds.set(true);
            availableKinds.set(data);
            var customSearchableAttrs = _.cloneDeep(_.get(instance, 'data.org.customSearchableAttrs', {}));
            customSearchableAttrsObj.set(customSearchableAttrs);
        });
    });
    this.autorun(()=>{
        var orgName = FlowRouter.getParam('baseOrgName');
        Orgs.findOne({ name: orgName, });
        var inst = Template.instance();
        _.defer(()=>{
            updateChangesTracker(inst);
        });
    });
});
Template.OrgManageSearchableAttrs.helpers({
    loadedKinds(){
        return loadedKinds.get();
    },
    org(){
        return Template.instance().data.org;
    },
    availableKinds(){
        return availableKinds.get();
    },
    unusedKinds(){
        var availableKinds = Template.OrgManageSearchableAttrs.__helpers.get('availableKinds').call(Template.instance());
        var usedKinds = Template.OrgManageSearchableAttrs.__helpers.get('usedKinds').call(Template.instance());
        return _.without(availableKinds, ...usedKinds);
    },
    isTrackBtnDisabled(){
        var unusedKinds = Template.OrgManageSearchableAttrs.__helpers.get('unusedKinds').call(Template.instance());
        return (unusedKinds.length < 1 ? 'disabled' : '');
    },
    usedKinds(){
        return _.keys(_.get(Template.currentData(), 'org.customSearchableAttrs', {}));
    },
    kindIsUsed(kind){
        var usedKinds = Template.OrgManageSearchableAttrs.__helpers.get('usedKinds').call(Template.instance());
        return _.includes(usedKinds, kind);
    },
    hasAnyUsedKinds(){
        var usedKinds = Template.OrgManageSearchableAttrs.__helpers.get('usedKinds').call(Template.instance());
        return (usedKinds.length > 0);
    },
    attrsUsedForKind(kind){
        return _.get(Template.currentData(), ['org', 'customSearchableAttrs', kind], []);
    },
    exampleAttrPaths(){
        return [
            'metadata.name',
            'metadata.namespace',
            'spec.template.spec.containers[0].image',
            'metadata.annotations["deployment.kubernetes.io/revision"]',
        ];
    },
    canSaveIdx(kind, idx){
        if(idx == -1){
            return true;
        }
        var hasChanges = _.get(changesTracker.get(), [kind, idx]);
        return hasChanges;
    },
});

var updateChangesTracker = (templateInstance)=>{
    var org = Orgs.findOne({ name: templateInstance.data.orgName, });
    var originalSearchableAttrs = _.get(org, 'customSearchableAttrs', {});

    var obj = {};
    var formVals = {};
    $('.kindContainer').each(function(){
        var kind = $(this).attr('kind');
        obj[kind] = [];
        $(this).find('.attrPathContainer').each(function(){
            var idx = $(this).attr('idx');
            var val = $(this).find('.attrPathItem').val();
            var originalVal = _.get(originalSearchableAttrs, [kind, idx], null);
            var hasChanges = (val != originalVal);
            obj[kind].push(hasChanges);
            formVals[`${kind}_${idx}`]=val;
        });
    });
    changesTracker.set(obj);
};

Template.OrgManageSearchableAttrs.events({
    'keyup .attrPathItem'(){
        // updates the changesTracker
        updateChangesTracker(Template.instance());
    },
    'click .trackBtn'(e){
        var $el = $(e.currentTarget);
        var $kind = $el.closest('.input-group').find('.trackKindDropdown');
        var kind = $kind.val();
        Meteor.call('addCustomSearchableAttrKind', Session.get('currentOrgId'), kind, ()=>{
        });
    },
    'click .removeAttrPathBtn'(e){
        var $el = $(e.currentTarget);
        var $container = $el.closest('.attrPathContainer');
        var kind = $container.attr('kind');
        var idx = parseInt($container.attr('idx'));

        if(idx == -1){
            $container.find('.attrPathItem').val('');
            return;
        }

        $el.prop('disabled', true);
        Meteor.call('deleteCustomSearchableAttrKindIdx', Session.get('currentOrgId'), kind, idx, ()=>{
        });
    },
    'click .saveAttrPathBtn'(e){
        var $el = $(e.currentTarget);
        var $container = $el.closest('.attrPathContainer');
        var kind = $container.attr('kind');
        var idx = parseInt($container.attr('idx'));
        var val = $container.find('.attrPathItem').val();

        // if its the new attr and no val set, doesnt do anything
        if(idx == -1 && val == ''){
            return;
        }

        Meteor.call('setCustomSearchableAttrKindIdx', Session.get('currentOrgId'), kind, idx, val, ()=>{
            if(idx == -1){
                $container.find('.attrPathItem').val('');
            }
        });
    },
    'click .deleteKindGroupBtn'(e){
        var $el = $(e.currentTarget);
        var $modal = $el.siblings('.deleteModal');
        $modal.modal('show');
        return false;
    },
    'click .deleteKindGroupConfirmBtn'(e){
        var $el = $(e.currentTarget);
        var $modal = $el.closest('.modal');
        var $container = $modal.closest('.kindContainer');
        var kind = $container.attr('kind');

        $modal.modal('hide');

        Meteor.call('deleteCustomSearchableAttrKind', Session.get('currentOrgId'), kind, ()=>{
        });

        return false;
    }
});
