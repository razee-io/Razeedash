import { Meteor } from 'meteor/meteor';
import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import _ from 'lodash';
import { Resources } from '../../../api/resource/resources';
import Blaze from 'meteor/gadicc:blaze-react-component';
import moment from 'moment';
import resourceKinds from './resourceKindComponents';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from "meteor/session";

export class ResourcesSingle extends React.Component {
    render() {
        if(this.props.isLoading){
            return (
                <Blaze template="loading" />
            );
        }
        var resourceName = _.get(this.props.resource, 'searchableData.name', this.props.selfLink);
        return (
            <div className="card m-2">
                <div className="card-header">
                    <h4 className="mb-0 text-muted">
                        Resource "{resourceName}" on <a href={FlowRouter.path('cluster.tab', { id: this.props.clusterId, tabId: 'resources' })}>{this.props.clusterId}</a>
                    </h4>
                </div>
                <div className="card-body">
                    {this.props.resource &&
                        <ResourcesSingle_default resource={this.props.resource} />
                    }
                    {!this.props.resource &&
                        <div>Resource "{this.props.selfLink}" not found</div>
                    }
                </div>
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
        return (
            <div>

                <ResourceKindAttrTable {...this.props} />

                {KindResourceTagName &&
                    <KindResourceTagName {...{data, ...this.props}} />
                }

                <div className="card mt-0">
                    <h4 className="card-header text-muted">Yaml data</h4>
                    <div className="card-body">
                        <Blaze template="stringifyp" data={JSON.parse(this.props.resource.data)} />
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
            return item.indexOf('annotations_') !== 0
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
                <div className="card-body p-0">
                    <table className="table table-striped mb-0">
                        <tbody>
                        {_.map(rows, (item)=>{
                            return <tr key={item.name}>
                                <td>{item.name}</td>
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
    ];
    var resource = Resources.findOne({
        cluster_id: clusterId,
        selfLink,
    });
    var isLoading = _.some(subs, (sub)=>{
        return !sub.ready();
    });
    return {
        selfLink, clusterId, isLoading,
        resource,
    };
})(ResourcesSingle);
