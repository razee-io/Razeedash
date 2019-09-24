import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import _ from 'lodash';

FlowRouter.pathFor = (pathDef, fields = {}, queryParams)=>{
    if(!_.get(fields, 'baseOrgName')){
        _.set(fields, 'baseOrgName', Session.get('currentOrgName'));
    }
    return FlowRouter.path(pathDef, fields, queryParams);
};
