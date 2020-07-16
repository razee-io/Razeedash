
import './page.html';
import '../subscriptions';
import '../subscriptions/groupSelect';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Groups } from '/imports/api/deployables/groups/groups';
import { Clusters } from '/imports/api/cluster/clusters/clusters.js';
import { DeployableVersions } from '/imports/api/deployables/channels/deployableVersions';
import { Subscriptions } from '/imports/api/deployables/subscriptions/subscriptions.js';
import Clipboard from 'clipboard';
import { updateClusterGroup, clusterName } from '../utils.js';

import { FlowRouter } from 'meteor/kadira:flow-router';
import toastr from 'toastr';

import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';

let editMode = new ReactiveVar(false);
let updating = new ReactiveVar(null);
const state = new ReactiveDict();

let groupHandle;
Template.group_single.onCreated(function() {
    this.autorun(()=>{
        this.subscribe('channels', Session.get('currentOrgId'));
        groupHandle = this.subscribe('groups', Session.get('currentOrgId'));
        this.subscribe('deployableVersions', Session.get('currentOrgId'));
        editMode.set(false);
        const clusters = Clusters.find({ org_id: Session.get('currentOrgId')}).fetch();
        clusters.forEach(cluster => {
            state.set(clusterName(cluster), cluster.cluster_id);
        });
    });
});

Template.group_single.onRendered( () => {
    const clipboard = new Clipboard('.copy-button');
    clipboard.on('success', function(e) {
        $(e.trigger).tooltip('show');
        e.clearSelection();
        setTimeout(function() {
            $(e.trigger).tooltip('dispose');
        }, 800);
    });
});

let clustersHandle;
Template.group_details.onCreated(function() {
    this.autorun(()=>{
        clustersHandle = this.subscribe('clusters.org', Session.get('currentOrgId'));
    });
});

Template.group_details.helpers({
    getCurrentClusters(group) {
        // console.log(group);
        const uuid = group.uuid;
        const clusters = Clusters.find({ org_id: Session.get('currentOrgId'), 'groups.uuid': {$in: [uuid]}}).fetch();
        let clusterNames = clusters.map(cluster => {
            return clusterName(cluster);
        });
        return clusterNames;
    },
    editMode() {
        return editMode.get();
    },
    updating() {
        const clustersReady = clustersHandle && clustersHandle.ready() ;
        return !clustersReady || updating.get();
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
    'click .js-set-edit-mode, keypress .js-set-edit-mode'(e){
        e.preventDefault();
        editMode.set(true);
        return false;
    },
});

Template.group_single.helpers({
    group() {
        const groupId = FlowRouter.current().params.id;
        const group = Groups.findOne({'org_id': Session.get('currentOrgId'), 'uuid': groupId });
        return group;
    },
    showNoGroupMessage() {
        const groupId = FlowRouter.current().params.id;
        const group = Groups.findOne({'org_id': Session.get('currentOrgId'), 'uuid': groupId });
        return groupHandle && groupHandle.ready() && !group;
    },
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

Template.cluster_group_single_buttons.events({
    'click .js-cancel-btn[data-operation=update]'(e) {
        e.preventDefault();
        editMode.set(false);
    },
    async 'click .js-save-btn[data-operation=update]'(e, template) {
        e.preventDefault();
        const uuid = template.data.group.uuid;
        const newClusterList = $(`.js-cluster-select[data-id=${uuid}]`).val();
        const newClusterIds = newClusterList.map((clusterName) => state.get(clusterName));
        
        updating.set(true);
        let err = await updateClusterGroup(Session.get('currentOrgId'), uuid, newClusterIds);
        if(err) {
            toastr.error(err.error, 'Error updating cluster group items');
        }
        updating.set(false);
        return;
    },
});
