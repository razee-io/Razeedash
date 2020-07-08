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

import { Meteor } from 'meteor/meteor';
import { Stats } from './stats.js';
import { Clusters } from '../cluster/clusters/clusters.js';
import { Resources } from '../resource/resources.js';
import { Subscriptions } from '../deployables/subscriptions/subscriptions.js';

Meteor.methods({
    updateResourceStats(orgId){
        var userId = Meteor.userId();
        if(!userId){
            throw new Meteor.Error('not logged in');
        }
        const clusterCount = Clusters.find({org_id: orgId}).count();
        const resourceCount = Resources.find({org_id: orgId, deleted: false}).count();
        const deployablesCount = Subscriptions.find({org_id: orgId}).count();
        console.log(clusterCount);
        console.log(resourceCount);
        console.log(deployablesCount);
        
        console.log(orgId);
        
        Stats.update({ org_id: orgId }, { $set: { deploymentCount: resourceCount, clusterCount: clusterCount, deployablesCount: deployablesCount  } } );
    },
});
