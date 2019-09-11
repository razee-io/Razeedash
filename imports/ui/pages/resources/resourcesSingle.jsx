import { Meteor } from 'meteor/meteor';
import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import _ from 'lodash';
import { Resources } from '../../../api/resource/resources';
import { ResourcesYamlHist, ResourceYamlHist } from '../../../api/resourceYamlHist/resourceYamlHist';
import Blaze from 'meteor/gadicc:blaze-react-component';
import moment from 'moment';
import resourceKinds from './resourceKindComponents';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from "meteor/session";
import { StrDiff } from '../../components/strDiff/index.jsx';

export class ResourcesSingle extends React.Component {
    render() {
        if(this.props.isLoading){
            return (
                <Blaze template="loading" />
            );
        }
        var resourceName = _.get(this.props.resource, 'searchableData.name', this.props.selfLink);
        return (
            <div>
                <div className="card m-2">
                    <div className="card-header">
                        <h4 className="mb-0 text-muted">
                            Resource "{resourceName}" on <a href={FlowRouter.path('cluster.tab', { id: this.props.clusterId, tabId: 'resources' })}>{this.props.clusterId}</a>
                        </h4>
                    </div>
                    <div className="card-body">
                        {this.props.resource &&
                            <ResourcesSingle_default {...this.props} />
                        }
                        {!this.props.resource &&
                            <div>Resource "{this.props.selfLink}" not found</div>
                        }
                    </div>
                </div>
            </div>
        );
    }
}





export class ResourceHistDiff extends React.Component{
    componentWillMount(){
        this.renderDropdown = this.renderDropdown.bind(this);
        this.renderDiff = this.renderDiff.bind(this);
        this.switchToUpdateTime = this.switchToUpdateTime.bind(this);

        this.setState({
            loading: true,
        });
        this.switchToUpdateTime(null);
    }

    switchToUpdateTime(timestamp){
        this.setState({
            updatedTime: timestamp,
            loading: true,
            compareYamls: [],
        });
        var resource = this.props.resource;
        Meteor.call('getTwoYamlHistsAtTimestamp', resource.org_id, resource.cluster_id, resource.selfLink, timestamp, (err, data)=>{
            this.setState({
                compareYamls: data,
                loading: false,
            });
        });
    }

    renderDropdown(){
        var resourceYamlHistItems = this.props.resourceYamlHistItems;
        return (
            <div className="dropdown yamlHistDropdown">
                <button className="btn btn-primary dropdown-toggle mb-3" type="button" data-toggle="dropdown">
                    Recent Changes
                </button>
                <div className="dropdown-menu">
                    {_.map(resourceYamlHistItems, (histItem, idx)=>{
                        var isActive = (histItem.updated - 0 == this.state.updatedTime) || (this.state.updatedTime == null && idx == 0);
                        return (
                            <div className={`dropdown-item ${isActive ? 'active' : ''}`} key={histItem._id} onClick={()=>{this.switchToUpdateTime(histItem.updated - 0)}}>
                                {moment(histItem.updated).format('LT, ll')}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    renderDiff(){
        var oldStr = _.get(this.state, 'compareYamls[1].yamlStr', '');
        var newStr = _.get(this.state, 'compareYamls[0].yamlStr', '');
        _.attempt(()=>{
            oldStr = JSON.stringify(JSON.parse(oldStr), null, 2);
        });
        _.attempt(()=>{
            newStr = JSON.stringify(JSON.parse(newStr), null, 2);
        });
        return (
            <StrDiff {...{ oldStr, newStr }} />
        );
    }

    render(){
        var resource = this.props.resource;
        if(!resource){
            return null;
        }

        return (
            <div>
                {this.renderDropdown()}
                {this.state.loading && <Blaze template="loading" />}
                {this.renderDiff()}
            </div>
        );
    }
}

export class ResourcesSingle_default extends React.Component{
    render(){
        var data = JSON.parse(this.props.resource.data);
        var kind = this.props.resource.searchableData.kind;
        var KindResourceTagName = null;
        if(resourceKinds[kind]){
            KindResourceTagName = resourceKinds[kind];
        }
        var histAttrs = {
            resourceYamlHistItems: this.props.resourceYamlHistItems,
            resource: this.props.resource,
        };
        return (
            <div>

                <ResourceKindAttrTable {...this.props} />

                {KindResourceTagName &&
                    <KindResourceTagName {...{data, ...this.props}} />
                }

                <div className="card mt-0">
                    <h4 className="card-header text-muted">Resource</h4>
                    <div className="card-body">
                        <div className="accordion" id="resource-yaml-accordion">
                            <div className="card">
                                <div className="card-header">
                                    <button className="btn btn-link" type="button" data-toggle="collapse" data-target="#resource-yaml-accordion-changes">
                                        Changes
                                    </button>
                                </div>
                                <div id="resource-yaml-accordion-changes" className="collapse">
                                    <div className="card-body">
                                        <ResourceHistDiff {...histAttrs} />
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <button className="btn btn-link" type="button" data-toggle="collapse" data-target="#resource-yaml-accordion-full">
                                        Full Object
                                    </button>
                                </div>
                                <div id="resource-yaml-accordion-full" className="collapse show">
                                    <div className="card-body">
                                        <Blaze template="stringifyp" data={JSON.parse(this.props.resource.data)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class ResourceKindAttrTable extends React.Component{
    render(){
        var attrNames = _.filter(_.keys(this.props.resource.searchableData), (item) => { 
            // the annotations keys won't look good when displayed in the table so we remove them here
            return item.indexOf('annotations[') !== 0
        });
        var rows = _.map(attrNames, (attrName)=>{
            var val = this.props.resource.searchableData[attrName];
            if(_.isDate(val)){
                val = moment(resource.updated-0).format('lll');
            }
            var name = attrName.replace(/(^|[^A-Z])([A-Z])/g, '$1 $2');
            name = name.replace(/(^| )([a-z])/, (z, space, letter)=>{
                return `${space}${letter.toUpperCase()}`;
            });
            return {
                name, val,
            };
        });
        
        const resourceData = JSON.parse(this.props.resource.data);
        if(resourceData.metadata && resourceData.metadata.annotations) {
            for (let attrKey in resourceData.metadata.annotations) {
                rows.push({ name: `Annotation: ${attrKey}`, val: resourceData.metadata.annotations[attrKey] })
            }
        }
        
        return (
            <div className="card mb-3">
                <h4 className="card-header text-muted">Attributes</h4>
                <div className="card-body p-0 stacked table-responsive">
                    <table className="table table-striped mb-0">
                        <tbody>
                        {_.map(rows, (item)=>{
                            return <tr key={item.name}>
                                <td className="smallHeader">{item.name}</td>
                                <td>{item.val}</td>
                            </tr>
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

export default withTracker(()=>{
    var selfLink = FlowRouter.getQueryParam('selfLink') || '';
    var clusterId = FlowRouter.getParam('clusterId') || '';
    var orgId = Session.get('currentOrgId');
    var subs = [
        Meteor.subscribe('resources.bySelfLink', orgId, clusterId, selfLink),
        Meteor.subscribe('clusters.id', Session.get('currentOrgId'), clusterId),
        Meteor.subscribe('resourceData.bySelfLink', orgId, clusterId, selfLink),
        Meteor.subscribe('resourceYamlHist.histForSelfLink', orgId, clusterId, selfLink),
    ];
    var resource = Resources.findOne({
        cluster_id: clusterId,
        selfLink,
    });
    var resourceYamlHistItems = ResourceYamlHist.find({ org_id: orgId, cluster_id: clusterId, resourceSelfLink: selfLink }).fetch();
    var isLoading = _.some(subs, (sub)=>{
        return !sub.ready();
    });
    return {
        orgId, clusterId,
        selfLink, isLoading,
        resource, resourceYamlHistItems,
    };
})(ResourcesSingle);
