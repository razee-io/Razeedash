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

import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Resources = new Mongo.Collection('resources');

Resources.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
});

try {
    if ( Meteor.isServer ) {
        Resources._ensureIndex( { 
            'cluster_id': 'text', 
            'cluster_name': 'text',
            'searchableData.name': 'text', 
            'searchableData.namespace': 'text', 
            'searchableData.kind': 'text',
            'selfLink': 'text'
        },
        {name: 'cluster_id_text_searchableData.name_text_searchableData.namespace_text' } );
    }
} catch (error) {
    console.log(error);
}
