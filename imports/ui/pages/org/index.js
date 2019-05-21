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
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Orgs } from '/imports/api/org/orgs';
import ace from 'ace-builds/src-min-noconflict/ace';
import Clipboard from 'clipboard';
import Mustache from 'mustache';
import _ from 'lodash';

const yaml = new ReactiveVar();
const serverYaml = new ReactiveVar();
const dirtyFlag = new ReactiveVar( false );

var getMustacheVarNamesFromTemplate = (template)=>{
    var tokens;
    try{
        tokens = Mustache.parse(template);
    }catch(e){
        //some error in the template. user could be in the middle of adding a new var. assumes theyll fix soon, and just returns the var name cache
        return getMustacheVarNamesFromTemplate.varNamesCache;
    }
    var getVarNamesRecurs = (tokenArr, prefix='')=>{
        var varNames = [];
        _.each(tokenArr, (token)=>{
            if(_.includes(['name', '&', '^', '#'], token[0])){
                varNames.push(`${prefix}${token[1]}`);
                if(_.isArray(token[4])){
                    varNames = _.union(varNames, getVarNamesRecurs(token[4], `${prefix}${token[1]}.`));
                }
            }
        });
        return varNames;
    };
    var varNames = _.uniq(getVarNamesRecurs(tokens));
    getMustacheVarNamesFromTemplate.varNamesCache = varNames;
    return varNames;
};
getMustacheVarNamesFromTemplate.varNamesCache = [];

var parseVarsForOrg = (varNames, org)=>{
    var globals = {
        uuid: 'unique id',
        base64: 'function',
        isUpdate: 'boolean',
    };
    var handleVarName = (path)=>{
        var parts = path.split('.');
        var outPath = [];
        var ref = null;
        _.each(parts, (part)=>{
            if(ref && !_.isUndefined(ref[part])){
                outPath.push(part);
                ref = ref[part];
                return;
            }
            else if(!_.isUndefined(org[part])){
                outPath = [ part ];
                ref = org[part];
                return;
            }
            else if(!_.isUndefined(globals[part])){
                outPath = [ part ];
                ref = globals[part];
            }
            else{
                outPath = [];
                ref = undefined;
            }
        });
        if(outPath.length < 1){
            outPath = parts;
            ref = undefined;
        }
        return {
            name: outPath.join('.'),
            val: ref,
            isUndefined: _.isUndefined(ref),
        };
    };
    var filterUndefinedWithDepth = (varObjs)=>{
        // any user-added vars must not have depth to them. so removes all undefined vars with a period in their name
        return _.filter(varObjs, (varObj)=>{
            if(varObj.isUndefined && _.includes(varObj.name, '.')){
                return false;
            }
            return true;
        });
    };
    var varObjs = _.map(varNames, handleVarName);
    varObjs = filterUndefinedWithDepth(varObjs);
    return varObjs;
};

Template.OrgSingle.onCreated( () => {
    const template = Template.instance();
    template.autorun(()=>{
        var orgName = FlowRouter.getParam('baseOrgName');
        template.orgName = orgName;
        template.org = Orgs.findOne({ name: orgName, });
    });
});

Template.OrgSingle.onRendered( () => {
    const template = Template.instance();

    template.editor = ace.edit( 'editor' );
    template.editor.setShowPrintMargin(false);
    template.editor.session.setMode( 'ace/mode/yaml' );
    template.editor.session.on('change', () => {
        if ( template.editor.getValue() != serverYaml.get() ) {
            dirtyFlag.set(true);
        }
        else {
            dirtyFlag.set(false);
        }
        yaml.set( template.editor.getValue() );
    });

    const cursor = Orgs.find( { name: template.orgName } );
    cursor.observe( {
        added: (newDoc) => {
            if (newDoc.orgYaml) {
                serverYaml.set( newDoc.orgYaml );
                template.editor.session.setValue(newDoc.orgYaml);
            }
        },
        changed: (newDoc, oldDoc) => {
            if ( newDoc.orgYaml && (newDoc.orgYaml != _.get(oldDoc, 'orgYaml', ''))) {
                serverYaml.set(newDoc.orgYaml);
                template.editor.session.setValue(newDoc.orgYaml);
            }
        }
    });

    new Clipboard('.copy-button');
});

Template.OrgSingle.helpers({
    org(){
        return Orgs.findOne({ name: Template.instance().orgName });
    },
    inventoryYamlUrl(key){
        var url = Meteor.absoluteUrl(`api/install/inventory?orgKey=${key}`);
        if(Meteor.settings.public.RAZEEDASH_API_URL){
            url = `${Meteor.settings.public.RAZEEDASH_API_URL}api/install/inventory?orgKey=${key}`;
        }
        return url;
    },
    kapitanYamlUrl(key){
        var url = Meteor.absoluteUrl(`api/install/kapitan?orgKey=${key}`);
        if(Meteor.settings.public.RAZEEDASH_API_URL){
            url = `${Meteor.settings.public.RAZEEDASH_API_URL}api/install/kapitan?orgKey=${key}`;
        }
        return url;
    },
    firstOrgKey(org){
        return org.orgKeys[0];
    },
    disabled() {
        return dirtyFlag.get() ? {} : {disabled: 'disabled'};
    },
    hasMustacheVars(){
        var varNames = Template.OrgSingle.__helpers.get('getMustacheVarsFromTemplate').call(Template.instance());
        return (varNames.length > 0);
    },
    getMustacheVarsFromTemplate(){
        var org = Template.OrgSingle.__helpers.get('org').call(Template.instance());
        var varNames = getMustacheVarNamesFromTemplate(yaml.get());
        varNames = parseVarsForOrg(varNames, org);
        return varNames;
    },
    customVarVal(attrName){
        var org = Template.OrgSingle.__helpers.get('org').call(Template.instance());
        return _.get(org, `orgYamlCustomVars.${attrName}`, '');
    },
    customVarSaveStatus(attrName){
        return customYamlVarSaveStatus.get(attrName) || 'unknown';
    },
});

var customYamlVarSaveStatus = new ReactiveDict(); // states: ['unknown', 'saving', 'saved', 'error']

Template.OrgSingle.events({
    'submit': (event) => {
        event.preventDefault();
        Meteor.call('saveOrgYamlTemplate', Template.instance().org._id, yaml.get(), (error) => {
            dirtyFlag.set(false);
            if( error ) {
                alert( 'Error saving template: ' + error.message );
            }
        } );
    },
    'keydown .customYamlVar'(e){
        var $el = $(e.currentTarget).closest('.customYamlVar');
        var attrName = $el.attr('yamlvarname');
        customYamlVarSaveStatus.set(attrName, 'unknown');
    },
    'change .customYamlVar'(e){
        var $el = $(e.currentTarget).closest('.customYamlVar');
        var orgId = Template.instance().org._id;
        var val = $el.val();
        var attrName = $el.attr('yamlvarname');
        customYamlVarSaveStatus.set(attrName, 'saving');
        Meteor.call('setOrgYamlCustomVar', orgId, attrName, val, (err)=>{
            if(err){
                customYamlVarSaveStatus.set(attrName, 'error');
                throw err;
            }
            customYamlVarSaveStatus.set(attrName, 'saved');
        });
    },
});
