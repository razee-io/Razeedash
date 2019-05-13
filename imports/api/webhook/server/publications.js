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

import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { WebhookLogs } from '../webhookLogs.js';

Meteor.publish('webhook_log.mostRecentByClusterIdWebhookUrl', (clusterId, webhookId)=>{
    check( clusterId, String );
    check( webhookId, String );
    return WebhookLogs.find({ cluster_id: clusterId, webhook_id: webhookId }, { limit: 10, sort: { created: -1 } } );
});
