
import './page.html';
import './page.scss';
import '../../../components/deployables/subscriptions';
import '../../../components/deployables/subscriptions/groupSelect';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Groups } from '/imports/api/deployables/groups/groups';
import { Clusters } from '/imports/api/cluster/clusters/clusters.js';
import { DeployableVersions } from '/imports/api/deployables/channels/deployableVersions';
import { Subscriptions } from '/imports/api/deployables/subscriptions/subscriptions.js';
// import Clipboard from 'clipboard';


import { FlowRouter } from 'meteor/kadira:flow-router';
// import toastr from 'toastr';

import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';

let editMode = new ReactiveVar(false);

function clusterName(cluster) {
    let name = '';
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
}

Template.group_single.onCreated(function() {
    this.autorun(()=>{
        // const groupId = Template.currentData().groupId();
        // const groupId = FlowRouter.current().params.id;

        // const groupName = Template.currentData() ? Template.currentData().group: '';
        Meteor.subscribe('channels', Session.get('currentOrgId'));
        Meteor.subscribe('groups', Session.get('currentOrgId'));
        // Meteor.subscribe('subscriptions.byClusterGroup', Session.get('currentOrgId'), groupId);
        Meteor.subscribe('deployableVersions', Session.get('currentOrgId'));
        editMode.set(false);
    });
    // $(function() {
    //     $('[data-toggle="tooltip"]').tooltip();
    // });
});

Template.group_single.onRendered( () => {
    // const $modal = $('.js-add-group-modal');
    // $modal.modal('hide');
    // const clipboard = new Clipboard('.copy-button');
    // clipboard.on('success', function(e) {
    //     $(e.trigger).tooltip('show');
    //     e.clearSelection();
    // });
});

Template.group_details.helpers({
    getCurrentClusters(group) {
        // console.log(group);
        const uuid = group.uuid;
        const clusters = Clusters.find({ org_id: Session.get('currentOrgId'), 'groups.uuid': {$in: [uuid]}}).fetch();
        let clusterNames = clusters.map(cluster => {
            return clusterName(cluster);
        });
        // console.log(clusterNames);
        return clusterNames;
    }
});

Template.group_details.events({
    'click .js-group-remove, keypress .js-group-remove'(e, template){
        e.preventDefault();
        const uuid = template.data.group.uuid;
        const $modal = $(`.js-delete-label-modal[data-id=${uuid}]`);
        $modal.modal('show');
        $('.js-actions-dropdown').dropdown('hide');
        return false;
    },
});

Template.group_single.helpers({
    group() {
        const groupId = FlowRouter.current().params.id;
        const group = Groups.findOne({'org_id': Session.get('currentOrgId'), 'uuid': groupId });
        return group;
    },
});


Template.all_clusters_in_group.events({ 
   
});
Template.all_clusters_in_group.helpers({
    clustersInGroup() {
        const inst = Template.instance();
        const uuid = inst.data.group.uuid;
        const clusters = Clusters.find({ org_id: Session.get('currentOrgId'), 'groups.uuid': {$in: [uuid]}}).fetch();
        clusters.map(cluster => {
            cluster.found_name = clusterName(cluster);
        });
        return clusters;
    },
    showComma(index, len) {
        return (index < len - 1);
    }
});


Template.group_subscription_list.onCreated(function() {
    this.autorun(()=>{
        const groupName = Template.currentData() ? Template.currentData().group.name : '';
        Meteor.subscribe('subscriptions.byClusterGroup', Session.get('currentOrgId'), groupName);
    });
});
Template.subscription_row.events({
    'click'() {
        const id = Template.instance().data.subscription.channel_uuid;
        const params = { 
            baseOrgName: Session.get('currentOrgName'),
            tabId: 'channels',
            id: id 
        };
        FlowRouter.go('channel.details', params );
        return;
    }
});

Template.group_subscription_list.events({
    'click .js-view-channels, keypress .js-view-channels'() {
        const params = { 
            baseOrgName: Session.get('currentOrgName'),
            tabId: 'channels',
        };
        FlowRouter.go('deployables', params );
    },
});

Template.group_subscription_list.helpers({
    canEdit() {
        return editMode.get() ? 'disabled' : '';
    },
    subscriptions(){
        const subs = Subscriptions.find({'org_id': Session.get('currentOrgId')}).fetch();
        return subs;        
    },
    currentVersion(version, id) {
        const subscriptions = Subscriptions.find({'org_id': Session.get('currentOrgId'), 'uuid': id}).fetch();
        if(subscriptions && subscriptions[0]) {
            return (version.name == subscriptions[0].version) ? 'selected': '';
        } else {
            return '';
        }
    },
    getVersions() {
        const channelId = FlowRouter.current().params.id;
        let versions = DeployableVersions.find({'org_id': Session.get('currentOrgId'), 'channel_id': channelId}).fetch();
        return versions;
    },
});
