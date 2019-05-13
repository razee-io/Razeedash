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
import { WebhookLogs } from '/imports/api/webhook/webhookLogs.js';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'lodash';

var newWebhookName = new ReactiveVar();

Template.cluster_webhooks.helpers({
    webhooks() {
        return _.sortBy(Template.currentData().cluster.webhooks || [], (a)=>{
            return -(a.created||0);
        });
    },
    addBtnDisabledClass(){
        return (newWebhookName.get() ? '' : 'disabled');
    },
});

Template.cluster_webhooks.events({
    'click #addWebhookBtn'(){
        var cluster_id = Template.currentData().cluster.cluster_id;
        var url = $('#newWebhookName').val();
        Meteor.call('addWebhookToCluster', cluster_id, url, (err)=>{
            if(err){
                throw err;
            }
            $('#newWebhookName').val('');
            newWebhookName.set('');
        });
        return false;
    },
    'click .removeWebhookBtn'(e){
        var $el = $(e.target).closest('.removeWebhookBtn');
        var webhookId = $el.attr('webhookid');
        $(`#removeWebhookModal-${webhookId}`).modal();
        return false;
    },
    'click .removeWebhookSubmitBtn'(e){
        var cluster_id = Template.currentData().cluster.cluster_id;
        var $el = $(e.target).closest('.modal');
        var webhookId = $el.attr('webhookid');
        $el.modal('hide');

        Meteor.call('removeWebhookFromCluster', cluster_id, webhookId, (err)=>{
            if(err){
                throw err;
            }
        });

        // workaround because the modal backdrop doesnt go away on its own
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    },
    'keyup #newWebhookName'(e){
        var $el = $(e.currentTarget);
        newWebhookName.set($el.val());
    },
});


Template.cluster_webhooks_recent_logs.onRendered(function(){
    this.autorun(()=>{
        var cluster = Template.currentData().cluster;
        var clusterId = cluster.cluster_id;
        var webhooks = cluster.webhooks;
        _.each(webhooks, (webhook)=>{
            this.subscribe('webhook_log.mostRecentByClusterIdWebhookUrl', clusterId, webhook.id);
        });
    });
});

Template.cluster_webhooks_recent_logs.helpers({
    logs(){
        var webhookId = Template.currentData().webhook.id;
        return WebhookLogs.find({ webhook_id: webhookId }, { sort: { created: -1 } });
    }
});

Template.cluster_webhooks_recent_log.helpers({
    payloadForLog(log){
        var payload = log.req.payload;
        try{
            payload = JSON.stringify(JSON.parse(payload), null, 4);
        }catch(e){
            alert( e );
        }
        return payload;
    },
    responseForLog(log){
        var res = JSON.parse(log.res);
        if(res.response){
            res = res.response;
        }
        return JSON.stringify(res, null, 4);
    },
    errorIconClass(log){
        return (log.hasError ? '' : 'd-none');
    },
    successIconClass(log){
        return (log.hasError ? 'd-none' : '');
    },
    logId(){
        var data = Template.currentData();
        return `${data.webhookIdx}_${data.logIdx}`;
    },
});
