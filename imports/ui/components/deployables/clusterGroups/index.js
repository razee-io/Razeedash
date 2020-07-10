
import './component.html';
import './component.scss';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Groups } from '/imports/api/deployables/groups/groups.js';
import { Clusters } from '/imports/api/cluster/clusters/clusters.js';
import _ from 'lodash';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict'; 
import { FlowRouter } from 'meteor/kadira:flow-router';

import toastr from 'toastr';

let editMode = new ReactiveVar(false);
let showNewGroupRow = new ReactiveVar(false);
let clickedItem = new ReactiveVar(null);
let updating = new ReactiveVar(null);
const state = new ReactiveDict();

// eslint-disable-next-line no-unused-vars
import selectpicker from 'bootstrap-select';

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

Template.clusters_select.onDestroyed( function() {
    console.log('on destroy');
    $('.js-cluster-select').selectpicker('destroy');
});
Template.clusters_select.onRendered( function() {
    $('.js-cluster-select').selectpicker({
        'actionsBox': true,
        'selectedTextFormat':'count > 5',
        'selectAllText': 'Select all',
        'deselectAllText': 'Deselect all',
        'countSelectedText': function (numSelected, numTotal) {
            if (numSelected == 1) {
                return '{0} cluster selected';
            } else if (numSelected === numTotal) {
                return 'All clusters selected ({0})';
            } else {
                return '{0} clusters selected';
            }
        },
        'iconBase': 'fa',
        'tickIcon': 'fa-check',
    });
});

Template.clusters_select.onCreated(function() {
    this.autorun(()=>{
        Meteor.subscribe('clusters.org', Session.get('currentOrgId'));
        editMode.set(true);
    });
});
Template.clusters_select.helpers({
    clusters() {
        const clusters = Clusters.find({ org_id: Session.get('currentOrgId')}).fetch();
        return clusters;
    },
    getClusterName(cluster){
        const name = clusterName(cluster);
        state.set(name, cluster.cluster_id);
        return name;
    },
    selectStatus(cluster){
        const inst = Template.instance();
        const currentClusters = inst.data.currentClusters || [];
        const name = clusterName(cluster);
        return currentClusters.indexOf(name) > -1 ? 'selected': '';
    }
});

let groupsHandle;
Template.cluster_group_list.onCreated(function() {
    this.autorun(()=>{
        groupsHandle = Meteor.subscribe('groups', Session.get('currentOrgId'));
        editMode.set(false);
    });
});

Template.clusters_in_group.helpers({
    clustersInGroup() {
        const inst = Template.instance();
        const uuid = inst.data.group.uuid;
        const maxDisplayItems = inst.data.limit;
        const clusters = Clusters.find({ org_id: Session.get('currentOrgId'), 'groups.uuid': {$in: [uuid]}}).fetch();
        let clusterNames = clusters.map(cluster => {
            return clusterName(cluster);
        });
        if(maxDisplayItems) {
            let results = clusterNames.slice(0,maxDisplayItems);
            if(clusterNames.length > maxDisplayItems) {
                const len = clusterNames.length;
                const remaining = len - maxDisplayItems;
                results.push(`+${remaining} more`); 
            }
            return results;
        } else {
            return clusterNames;
        }
    },
});

Template.clusters_in_group.events({
    'click'() {
        clickedItem.set(Template.instance().data.group);
    }
});

Template.cluster_group_list.helpers({
    updating() {
        return updating.get();
    },
    loaded() {
        return groupsHandle && groupsHandle.ready();
    },
    getCurrentClusters(group) {
        // console.log(group);
        const uuid = group.uuid;
        const clusters = Clusters.find({ org_id: Session.get('currentOrgId'), 'groups.uuid': {$in: [uuid]}}).fetch();
        let clusterNames = clusters.map(cluster => {
            return clusterName(cluster);
        });
        // console.log(clusterNames);
        return clusterNames;
    },
    editMode(id) {
        const selectedGroup = clickedItem.get() && clickedItem.get().uuid;
        return id === selectedGroup;
    },
    showNoGroupsMessage() {
        const groups = Groups.find({'org_id': Session.get('currentOrgId')}).fetch();
        const noChannels = (groups && groups.length > 0) ? false : true;
        return groupsHandle && groupsHandle.ready() && noChannels && !showNewGroupRow.get();
    },
    dataReady() {
        return groupsHandle && groupsHandle.ready();
    },
    showNewGroupRow() {
        return showNewGroupRow.get();
    },
    groups(){
        const groups = Groups.find({'org_id': Session.get('currentOrgId')}).fetch();
        // get all group owner ids and subscribe.
        const ownerIds = groups.map( (group) => group.owner )
            .filter( (element, index, arr) => index === arr.indexOf(element)) // remove duplicates
            .filter(Boolean);  // remove undefined items from the array
        Meteor.subscribe('users.byIds', ownerIds);
        return groups;        
    },
    buttonStatus() {
        if(editMode.get()) {
            return 'disabled';
        } else {
            return 'enabled';
        }
    },
    owner(id) {
        const user = Meteor.users.findOne({ _id: id });
        if (!user) {
            return '';
        }
        return user.profile.name;
    },
});

Template.cluster_group_actions.events({
    'click .js-set-edit-mode, keypress .js-set-edit-mode'() {
        clickedItem.set(Template.instance().data.group);
    },
    'click .js-group-details, keypress .js-group-details'(e, template) {
        const uuid = template.data.group.uuid;
        const params = { 
            baseOrgName: Session.get('currentOrgName'),
            tabId: 'groups',
            id: uuid
        };
        const $modal = $('.js-add-group-modal');
        $modal.modal('hide');
        FlowRouter.go('channel.details', params );
    },
    'click .js-label-remove, keypress .js-label-remove'(e, template){
        const uuid = template.data.group.uuid;
        
        e.preventDefault();
        // prevent the delete modal from displaying when adding/editing a row and using the enter key
        if(showNewGroupRow.get() || editMode.get()) {
            return false;
        }
        const $modal = $(`.js-delete-label-modal[data-id=${uuid}]`);
        $modal.modal('show');
        $('.js-actions-dropdown').dropdown('hide');
        return false;
    },
});
Template.cluster_group_list.events({
    'click .js-group-details, keypress .js-group-details'(e) {
        const id = $(e.target).data('id');
        const params = { 
            baseOrgName: Session.get('currentOrgName'),
            tabId: 'groups',
            id: id
        };
        const $modal = $('.js-add-group-modal');
        $modal.modal('hide');
        FlowRouter.go('channel.details', params );
    },
    'click .js-add-label'(e) {
        e.preventDefault();
        const labelName = $(e.target).closest('.group-item-new').find('input[name="groupName"]').val();
        const clusters = $(e.target).closest('.js-new-group-row').find('select.js-cluster-select').val();
        console.log(labelName);
        console.log(clusters);
        const clusterIds = clusters.map((cluster) => {
            return state.get(cluster);
        });
        console.log(clusterIds);

        const orgId =  Session.get('currentOrgId');
        // if(!clusters|| clusters.length == 0) {
        //     $(e.target).closest('.js-new-subscription').find('.select.js-group-select').addClass('is-invalid').focus();
        //     return false;
        // }
        
        if(!labelName|| labelName.length == 0) {
            $(e.target).closest('.group-item-new').find('input[name="groupName"]').addClass('is-invalid').focus();
            return false;
        }

        const groups = Template.cluster_group_list.__helpers.get('groups').call();
        const existingGroups = groups.map( (item) => item.name );
        if(_.includes(existingGroups, labelName)) {
            $(e.target).closest('.group-item-new').find('input[name="groupName"]').addClass('is-invalid').focus();
            return false;
        }

        Meteor.call('addGroup', orgId, labelName, (error, result) => {
            console.log(result);
            if(error) {
                toastr.error(error.error, 'Error adding a cluster group');
            } else {
                const uuid = result.data.addGroup.uuid;
                if(clusterIds.length > 0) {
                    Meteor.call('groupClusters', orgId, uuid, clusterIds, (error) => {
                        if(error) {
                            toastr.error(error.error, 'Error adding clusters to the cluster group');
                            $(e.target).closest('.js-cluster-select').selectpicker('refresh');
                            // $('.js-cluster-select').selectpicker('val', clusters);
                            console.error(error);
                        } 
                        Meteor.setTimeout(function(){
                            $(e.target).closest('.js-group-select').selectpicker('refresh');
                            $(e.target).closest('.js-group-select').selectpicker('val', labelName);
                            $(e.target).closest('.js-cluster-select').selectpicker('refresh');
                            $(e.target).closest('.js-cluster-select').selectpicker('val', clusters);
                            editMode.set(false);
                            showNewGroupRow.set(false);
                        }, 100);

                    });
                } else {
                    Meteor.setTimeout(function(){
                        $(e.target).closest('.js-group-select').selectpicker('refresh');
                        $(e.target).closest('.js-group-select').selectpicker('val', labelName);
                        $(e.target).closest('.js-cluster-select').selectpicker('refresh');
                        $(e.target).closest('.js-cluster-select').selectpicker('val', clusters);
                        editMode.set(false);
                        showNewGroupRow.set(false);
                    }, 100);
                }
                return false;
            }
        });
        // showNewGroupRow.set(false);
        // editMode.set(false);
        // return false;
    },

    'click .js-create-label'(e) {
        if(editMode.get()) {
            return;  //disables the button while rows are being edited
        }
        e.preventDefault();
        
        showNewGroupRow.set(true);
        $(e.target).closest('.group-item-new').find('input[name="groupName"]').focus();
        editMode.set(true);
    },
    // 'click .js-delete-label-confirm'(e) {
    //     const $el = $(e.currentTarget);
    //     const $modal = $el.closest('.js-delete-label-modal');
    //     const $container = $modal.closest('.group-item');
    //     const uuid = $container.data('id') + '';
    //     $modal.modal('hide');
    //     Meteor.call('removeGroup', Session.get('currentOrgId'), uuid,  (error)=>{
    //         if(error) {
    //             toastr.error(error.error, 'Error removing the cluster group');
    //             editMode.set(false);
    //             clickedItem.set(null);
    //         }
    //     });
    //     return false;
    // },
    // 'click .js-cancel-delete-label'(e) {
    //     e.preventDefault();
    //     const $modal = $('.js-delete-label-modal');
    //     $modal.modal('hide');
    // },
    'click .js-label-help'(e){
        e.preventDefault();
        var $modal = $('.js-label-help-modal');
        $modal.modal('show');
        return false;
    },
    'click .js-cancel-add-label'(e) {
        e.preventDefault();
        showNewGroupRow.set(false);
        editMode.set(false);
        clickedItem.set(null);
    },
    async 'click .js-update-label'(e) {
        e.preventDefault();
        const orgId =  Session.get('currentOrgId');
        const uuid = $(e.currentTarget).data('id');
        const newClusterList = $(`.js-cluster-select[data-id=${uuid}]`).val();
        const currentClusterList = Clusters.find({ org_id: Session.get('currentOrgId'), 'groups.uuid': {$in: [uuid]}}, {fields: {cluster_id: 1}}).fetch();
        const currentClusterIds = currentClusterList.map( (cluster) => cluster.cluster_id);
        const newClusterIds = newClusterList.map((cluster) => {
            return state.get(cluster);
        });

        const clustersToAdd = _.difference(newClusterIds, currentClusterIds);
        if(clustersToAdd.length > 0) {
            try {
                updating.set(true);
                await addClustersToGroup(orgId, uuid, clustersToAdd);
                updating.set(false);
            } catch (error) {
                toastr.error(error.error, 'Error adding cluster group items');
                $(e.target).closest('.js-cluster-select').selectpicker('refresh');
                // $('.js-cluster-select').selectpicker('val', clusters);
                console.error(error);
                return false;
            }
        }

        const clustersToDelete = _.difference(currentClusterIds, newClusterIds);
        if(clustersToDelete.length > 0) {
            try {
                await removeClustersFromGroup(orgId, uuid, clustersToDelete);
            } catch (error) {
                toastr.error(error.error, 'Error removing cluster group items');
                $(e.target).closest('.js-cluster-select').selectpicker('refresh');
                // $('.js-cluster-select').selectpicker('val', clusters);
                console.error(error);
                return false;
            }
        }
        editMode.set(false);
        clickedItem.set(null);
        return;
    }
});

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

Template.group_delete_modal.events({
    'click .js-delete-label-confirm'(e, template) {
        const $el = $(e.currentTarget);
        const $modal = $el.closest('.js-delete-label-modal');
        const uuid = template.data.group.uuid;
        $modal.modal('hide');
        Meteor.call('removeGroup', Session.get('currentOrgId'), uuid,  (error)=>{
            if(error) {
                toastr.error(error.error, 'Error removing the cluster group');
                editMode.set(false);
                clickedItem.set(null);
            }
        });
        return false;
    },
    'click .js-cancel-delete-label'(e) {
        e.preventDefault();
        const $modal = $('.js-delete-label-modal');
        $modal.modal('hide');
    },  
});
