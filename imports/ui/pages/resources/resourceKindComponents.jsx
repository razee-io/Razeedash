import React from 'react';
import moment from 'moment';
import _ from 'lodash';

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


class ResourceKindDeploymentType extends React.Component {
    render(){
        return (
            <div>

            </div>
        );
    }
}



export default {
    ConfigMap: ResourceKindConfigMap,
    Secret: ResourceKindSecret,
    DaemonSet: ResourceKindDaemonSet,
    Deployment: ResourceKindDeployment,
};