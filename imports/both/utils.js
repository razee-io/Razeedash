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

import _ from 'lodash';

exports.sanitizeRegexStr = (str) => {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

exports.addOrgIdToSearch = (orgId, search, attrName='org_id')=>{
    // backwards compat where if org_id is unset in db, we assume its 
    search = _.cloneDeep(search);
    if(orgId){
        search[attrName] = orgId;
    }
    else{
        // does a search where org_id is unset 
        // does this while also not breaking the original query. i.e. if it has $or's and $and's at the top level
        var orObj = [
            { org_id: { $exists: false }}
        ];
        if(search.$or){
            var ands = [
                { $or: search.$or},
                { $or: orObj }
            ];
            if(search.$and){
                search.$and = _.union(search.$and, ands);
            }
            else{
                search.$and = ands;
            }
            delete search.$or;
        }
        else {
            search.$or = orObj;
        }
    }
    return search;
};

exports.buildSearchForClusterName = (orgId, searchStr) => {
    var tokens = searchStr.split(/\s+/);
    var ands = _.map(tokens, (token) => {
        var searchRegex = { $regex: token, $options: 'i', };
        var ors = [
            { cluster_id: searchRegex, },
            { 'metadata.name': searchRegex, }
        ];
        var out = {
            $or: ors,
        };
        return out;
    });
    ands.push({
        org_id: orgId,
    });
    var search = {
        $and: ands,
    };
    return search;
};

exports.buildSearchForResourcesName = (orgId, searchStr = '', fromTime, toTime, isServer = false) => {
    var ands = [];
    var tokens = _.filter(searchStr.split(/\s+/));
    if(tokens.length > 0) {
        ands = _.map(tokens, (token) => {
            if(isServer) {
                return { '$text': { '$search': token, '$caseSensitive': false } };
            } else {
                var searchRegex = {$regex: token, $options: 'i',};
                var ors = [
                    {cluster_id: searchRegex,},
                    {cluster_name: searchRegex,},
                    {'searchableData.name': searchRegex},
                    {'searchableData.namespace': searchRegex},
                    {'searchableData.kind': searchRegex},
                    {kind: searchRegex,},
                    {selfLink: searchRegex},
                ];
                return { '$or': ors };
            }
        });
    }
    if(fromTime && toTime){
        ands.push({
            created: {
                $gte: new Date(fromTime),
                $lte: new Date(toTime),
            },
        });
    }
    else {
        if(fromTime){
            ands.push({
                created: {
                    $gte: new Date(fromTime),
                },
            });
        }
        if(toTime){
            ands.push({
                created: {
                    $lte: new Date(toTime),
                },
            });
        }
    }

    if(ands.length < 1){
        return null;
    }
    ands.push({
        org_id: orgId,
        deleted: false
    });
    var search = {
        $and: ands,
    };
    return search;
};
