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

// Used to store error messages sent from watch-keeper

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export const Messages = new Mongo.Collection('messages');

Messages.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

const messagesSchema = new SimpleSchema({
    cluster_id: { type: String, index: true, required: true },
    org_id: { type: String, index: true, required: true },
    message_hash: { type: String, index: true, required: true },
    message: { type: String, required: true },
    level: { type: String, required: true },
    data: { type: String, required: false},
    created: { type: Date, required: true, },
    updated: { type: Date, index: true, required: true, },
});

Messages.attachSchema(messagesSchema);
