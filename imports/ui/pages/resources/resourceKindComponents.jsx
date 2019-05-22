import React from 'react';
import moment from 'moment';
import _ from 'lodash';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from "meteor/meteor";
import { Resources } from '../../../api/resource/resources';
import { ResourcesSingle } from './resourcesSingle';
import { Session } from "meteor/session";
import Blaze from "meteor/blaze";
import Moment from '/imports/ui/components/moment';

class ResourceKindConfigMap extends React.Component {
    render(){
        return (
            <div>
            </div>
        );
    }
}
class ResourceKindSecret extends React.Component {
    render(){
        return (
            <div>
            </div>
        );
    }
}

class ResourceKindDeployment extends React.Component {
    render(){
        return (<ResourceKindDeploymentType {...this.props} />);
    }
}
class ResourceKindDaemonSet extends React.Component {
    render(){
        return (<ResourceKindDeploymentType {...this.props} />);
    }
}

class RecentDeploymentRow extends React.Component{
    render(){
        var deployment = this.props.deployment;
        deployment = {
            cluster_id: '1234',
            cluster_name: 'cluster_name',
            containers: [
                {
                    image: 'org/imageName:latest'
                },
                {
                    image: 'org/imageName:latest2'
                }
            ]
        };
        return (
            <tr>
                <td>
                    {deployment.cluster_id}
                    {deployment.cluster_name}
                </td>
                <td>
                    {_.map(deployment.containers, (container, idx)=>{
                        return (
                            <div className="row" key={idx}>
                                <div className="col text-nowrap text-truncate d-none d-md-table-cell" style={{ maxWidth: '95%'}}>
                                    {container.image}
                                </div>
                                <div className="col text-nowrap text-truncate d-md-none" style={{ maxWidth: '95%' }}>
                                    {container.image}
                                </div>
                            </div>
                        );
                    })}
                </td>
                <td>
                    {_.map(deployment.containers, (container, idx)=>{
                        return (
                            <div className="row" key={idx}>
                                <div className="col text-nowrap text-truncate" style={{maxWidth: '95%'}}>
                                    commit link
                                </div>
                            </div>
                        );
                    })}
                </td>
                <td>
                    <Moment datetime={978325200000}/>
                </td>
                {/*<td>*/}
                {/*    {{#if notRecent}}*/}
                {/*    {{> datawarning_deployment deployment=deployment}}*/}
                {/*    {{/if}}*/}
                {/*        <a href="{{pathFor 'cluster.tab' id=deployment.cluster_id tabId='resources'}}"> {{deployment.cluster_name}} </a>*/}
                {/*    {{#if deployment.cluster_locked}}*/}
                {/*        <span class="float-right">*/}
                {/*        <i class="fa fa-lock fa-lg" aria-hidden="true"></i>*/}
                {/*        </span>*/}
                {/*    {{/if}}*/}
                {/*        </td>*/}
                {/*        <td>*/}
                {/*        {{#each container in deployment.containers}}*/}
                {/*        <div class="row">*/}
                {/*        <div class="col text-nowrap text-truncate d-none d-md-table-cell" style="max-width: 95%">*/}
                {/*        <span class="d-inline-block">{{> React component=VAStatus container=container }}</span>*/}
                {/*        {{getImage container.image}}*/}
                {/*        </div>*/}
                {/*        <div class="col text-nowrap text-truncate d-md-none" style="max-width: 95%">*/}
                {/*        <span class="d-inline-block">{{> React component=VAStatus container=container }}</span>*/}
                {/*        {{getShortImage container.image}}*/}
                {/*        </div>*/}
                {/*        </div>*/}
                {/*        {{/each}}*/}
                {/*        </td>*/}

                {/*        <td>*/}
                {/*        {{#each container in deployment.containers}}*/}
                {/*        <div class="row">*/}
                {/*        <div class="col text-nowrap text-truncate" style="max-width: 95%">*/}
                {/*        {{> commitLink commit=(getTag container.image) deployment=deployment }}*/}
                {/*        </div>*/}
                {/*        </div>*/}
                {/*        {{/each}}*/}
                {/*        </td>*/}

                {/*        <td class="d-none d-md-table-cell">{{> commitLink commit=deployment.launchDarklyVersion deployment=deployment}}</td>*/}

                {/*        <td>*/}
                {/*        {{> history_dropdown _lastUpdated=(lastUpdated deployment) _imageHistory=(imageHistory deployment) deployment=deployment}}*/}
                {/*        </td>*/}
            </tr>
        );
    }
}

var ResourceKindDeploymentType =  withTracker((props)=>{
    console.log(2222, props)
    var deploymentName = props.resource.searchableData.name;

    var subs = [
        Meteor.subscribe('resources.recent', Session.get('currentOrgId')),
    ];
    var recentDeployments = Resources.find({}, { sort: { 'updated': -1 }, limit: 10 }).fetch();
    var isLoading = _.some(subs, (sub)=>{
        return !sub.ready();
    });
    return {
        deploymentName,
        recentDeployments,
        isLoading,
        ...props,
    };
})(class extends React.Component {
    render(){
        console.log(11111, this.props)

        return (
            <div>
                <div class="card my-3">
                    <h3 class="card-header">Containers</h3>
                    <div class="card-body p-0">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Image</th>
                                    <th>Ports</th>
                                    <th>Volume Mounts</th>
                                    <th>Envs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {_.map(_.get(this.props, 'data.spec.template.spec.containers', []), (container)=>{
                                    return (
                                        <tr>
                                            <td>{container.name}</td>
                                            <td>{container.image}</td>
                                            <td>{_.map(container.ports, 'containerPort').join(', ')}</td>
                                            <td>
                                                {_.map(_.get(container, 'volumeMounts', []), (volumeMount)=>{
                                                    return (
                                                        <div>
                                                            {volumeMount.name} - {volumeMount.mountPath}
                                                        </div>
                                                    );
                                                })}
                                            </td>
                                            <td class="p-0">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th class="p-1">Name</th>
                                                            <th class="p-1">Value Type</th>
                                                            <th class="p-1">Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                    {container.env.length > 0 &&
                                                        _.map(container.env, (envObj)=>{
                                                            var valType = 'string';
                                                            var val = envObj.value;
                                                            if(envObj.valueFrom){
                                                                var firstObjName = _.keys(envObj.valueFrom)[0];
                                                                var firstObj = envObj.valueFrom[firstObjName];
                                                                valType = firstObjName;
                                                                if(_.includes(['configMapKeyRef', 'secretKeyRef'], firstObjName)){
                                                                    val = `${firstObj.name}:${firstObj.key}`;
                                                                } else if(_.includes(['fieldRef'], firstObjName)){
                                                                    val = `${firstObj.apiVersion}:${firstObj.fieldPath}`;
                                                                }
                                                            }
                                                            return (
                                                                <tr>
                                                                    <td class="p-1">{envObj.name}</td>
                                                                    <td class="p-1">{valType}</td>
                                                                    <td class="p-1">{val}</td>
                                                                </tr>
                                                            );
                                                        })
                                                    }
                                                    {container.env.length == 0 &&
                                                        <span class="text-muted">None</span>
                                                    }
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-header">Recent Deployments of "{this.props.deploymentName}"</h3>
                    <div className="card-body p-0">
                        <table className="table table-striped">
                            <thead>
                            <tr>
                                <th>Cluster name</th>
                                <th>Container</th>
                                <th>Version</th>
                                <th>Changed</th>
                            </tr>
                            </thead>
                            <tbody>
                            {_.map(this.props.recentDeployments, (deployment, idx)=>{
                                return (<RecentDeploymentRow { ...{ deployment } } key={idx}/>);
                            })}
                            {this.props.recentDeployments.length < 1 &&
                            <tr>
                                <td colSpan="4" className="text-center">
                                    No deployments found
                                </td>
                            </tr>
                            }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
});



export default {
    ConfigMap: ResourceKindConfigMap,
    Secret: ResourceKindSecret,
    DaemonSet: ResourceKindDaemonSet,
    Deployment: ResourceKindDeployment,
};