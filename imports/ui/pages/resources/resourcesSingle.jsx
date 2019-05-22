import { Meteor } from 'meteor/meteor';
import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import _ from 'lodash';
import { Resources } from '../../../api/resource/resources';
import Blaze from 'meteor/gadicc:blaze-react-component';
import moment from 'moment';
import utils from '../../../both/utils';
import resourceKinds from './resourceKindComponents';


var localOrgKeySave = {
    keyName: 'savedOrgKeys',
    getFullObj:()=>{
        var obj = JSON.parse(localStorage.getItem(localOrgKeySave.keyName)||'{}')||{};
        return obj;
    },
    set:(name, val)=>{
        var obj = localOrgKeySave.getFullObj();
        obj[name]=val;
        localStorage.setItem(localOrgKeySave.keyName, JSON.stringify(obj));
    },
    get:(name)=>{
        var obj = localOrgKeySave.getFullObj();
        return obj[name];
    },
};

var decryptStr = (encrypted, token)=>{
    var success = false;
    var str;
    var data;
    try{
        str = utils.tokenCrypt.decrypt(encrypted, token);
        data = JSON.parse(str);
        success = true;
    }catch(e){
        success = false;
    }

    var out = { success, str, data, };
    return out;
};


export class ResourcesSingle extends React.Component {
    render() {
        if(this.props.isLoading){
            return (
                <Blaze template="loading" />
            );
        }
        return (
            <div className="card m-2">
                <div className="card-header">
                    <h4 className="mb-0">Resource {this.props.resourceName} on {this.props.clusterId}</h4>
                </div>
                <div className="card-body">
                    <ResourcesSingle_default resource={this.props.resource} />
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
        var attrNames = _.keys(this.props.resource.searchableData);
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
    var resourceName = FlowRouter.getParam('resourceName') || '';
    var clusterId = FlowRouter.getParam('clusterId') || '';
    var orgId = Session.get('currentOrgId');
    var subs = [
        Meteor.subscribe('resources.byName', orgId, resourceName, clusterId),
        Meteor.subscribe('clusters.id', clusterId),
        Meteor.subscribe('resourceData.byName', orgId, resourceName, clusterId),
    ];
    var resource = Resources.findOne({
        cluster_id: clusterId,
        'searchableData.name': resourceName,
    });
    var isLoading = _.some(subs, (sub)=>{
        return !sub.ready();
    });
    return {
        resourceName, clusterId, isLoading,
        resource,
    };
})(ResourcesSingle);