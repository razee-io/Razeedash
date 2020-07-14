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
import { Clusters } from '/imports/api/cluster/clusters/clusters.js';
import _ from 'lodash';

const addClustersToGroup = (orgId, uuid, clusterIds) => {
    return new Promise((resolve, reject) => {
        Meteor.call('groupClusters', orgId, uuid, clusterIds, (error, results) => {
            error ? reject(error) : resolve(results);
        });
    }); 
};

const removeClustersFromGroup = (orgId, uuid, clusterIds) => {
    return new Promise((resolve, reject) => {
        Meteor.call('unGroupClusters', orgId, uuid, clusterIds, (error, results) => {
            error ? reject(error) : resolve(results);
        });
    }); 
};

const updateClusterGroup = async (orgId, uuid, newClusterIds) => {

    const currentClusterList = Clusters.find({ org_id: orgId, 'groups.uuid': {$in: [uuid]}}, {fields: {cluster_id: 1}}).fetch();
    const currentClusterIds = currentClusterList.map( (cluster) => cluster.cluster_id);

    const clustersToAdd = _.difference(newClusterIds, currentClusterIds);
    if(clustersToAdd.length > 0) {
        try {
            await addClustersToGroup(orgId, uuid, clustersToAdd);
        } catch (error) {
            return new Meteor.Error(error.error);
        }
    }

    const clustersToDelete = _.difference(currentClusterIds, newClusterIds);
    if(clustersToDelete.length > 0) {
        try {
            await removeClustersFromGroup(orgId, uuid, clustersToDelete);
        } catch (error) {
            return new Meteor.Error(error.error);
        }
    }
    return;
};

const clusterName = (cluster) => {
    let name;
    if(cluster) {
        if(cluster.registration && cluster.registration.name) {
            name = cluster.registration.name;
        } else if(cluster.metadata && cluster.metadata.name) {
            name = cluster.metadata.name;
        } else {
            name = cluster.cluster_id;
        }
    }
    return name; 
};

exports.updateClusterGroup = updateClusterGroup;
exports.clusterName = clusterName;
