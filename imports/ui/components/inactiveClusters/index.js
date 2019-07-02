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
import { Clusters } from '/imports/api/cluster/clusters/clusters';
import '../../components/portlet';
import moment from 'moment';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

Template.inactiveClusters.helpers({
    zombieClusters: () => Clusters.find({ updated: { $lt: new moment().subtract(1, 'day').toDate() } }, { sort: { updated: -1 } }),
    hasZombieClusters: () => {
        const zombies = Clusters.find({ updated: { $lt: new moment().subtract(1, 'day').toDate() } }, { sort: { updated: -1 } }).count();
        return (zombies > 0) ? true : false; 
    },
});

Template.inactiveClusters.onCreated(function() {
    this.autorun(() => {
        this.subscribe('clusters.zombie', Session.get('currentOrgId'));
    });
});

Template.inactiveClusters.events({
    'click .delete'(event){
        var confirmation = confirm('Are you sure?');
        if (confirmation){
            Meteor.call('pruneCluster', Session.get('currentOrgId'), event.target.attributes['cluster_id'].value, (err) => {
                if (err){
                    throw err;
                }
            });
            Meteor.call('pruneClusterResources', Session.get('currentOrgId'), event.target.attributes['cluster_id'].value, (err) => {
                if (err) {
                    throw err;
                }
            });
        }
    }
        
});
