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
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { Orgs } from '/imports/api/org/orgs.js';

import './component.html';
import _ from 'lodash';
import { FlowRouter } from 'meteor/kadira:flow-router';
import Clipboard from 'clipboard';

Template.cluster_metadata.helpers({
    metadata: () => {
        const instance = Template.instance();
        const cluster = instance.data.cluster;
        if(!cluster || !cluster.metadata) {
            return;
        }
        const metadata = [];
        for(let key in cluster.metadata) {
            if(typeof cluster.metadata[key] !== 'object') {
                metadata.push({name: key, value: cluster.metadata[key] });
            }
        }
        return metadata;
    },
});

Template.deployable_details.onRendered( () => {
    const clipboard = new Clipboard('.copy-button');
    clipboard.on('success', function(e) {
        $(e.trigger).tooltip('show');
        e.clearSelection();
        setTimeout(function() {
            $(e.trigger).tooltip('dispose');
        }, 800);
    });
});
Template.deployable_details.helpers({
    kubeCommands() {
        const instance = Template.instance();
        const org = Orgs.findOne({ name: Session.get('currentOrgName') });
        const orgKey = org.orgKeys[0];
        const cluster = instance.data.cluster;
        let apiUrl = 'RAZEE_API';
        if(Meteor.settings.public.RAZEEDASH_API_URL){
            apiUrl = Meteor.settings.public.RAZEEDASH_API_URL;
            if(apiUrl.substr(-1) !== '/') {
                apiUrl += '/';
            }
        }

        return `kubectl create cm razee-identity -n razeedeploy --from-literal=CLUSTER_ID=${cluster.cluster_id} --from-literal=RAZEE_API=${apiUrl}
kubectl create secret generic razee-identity -n razeedeploy --from-literal=RAZEE_ORG_KEY=${orgKey}`;
    }
});

Template.cluster_info.helpers({
    clusterId(){
        return FlowRouter.getParam('id');
    },
    gitVersion(cluster){
        return _.get(cluster, 'metadata.kube_version.gitVersion');
    }
});
Template.cluster_info.events({
    'click #requestClusterResync'(){
        var clusterId = Template.cluster_info.__helpers.get('clusterId').call(Template.instance());
        Meteor.call('requestClusterResync', Session.get('currentOrgId'), clusterId, (err)=>{
            if(err){
                throw err;
            }
        });
    },
});
