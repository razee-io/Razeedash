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

import './component.scss';
import './component.html';
import { Template } from 'meteor/templating';

Template.kindIcon.helpers({
    getKindLabel(kind) {
        switch (kind) {
        case 'APIService':
            return 'AS';
        case 'ClusterRole':
            return 'CR';
        case 'ClusterRoleBinding':
            return 'CRB';
        case 'ConfigMap':
            return 'CM';
        case 'CustomResourceDefinition':
            return 'CRD';
        case 'DaemonSet':
            return 'Ds';
        case 'Deployment':
            return 'D';
        case 'Endpoints':
            return 'EPs';
        case 'Event':
            return 'E';
        case 'Job':
            return 'J';
        case 'Namespace':
            return 'Ns';
        case 'Node':
            return 'No';
        case 'Pod':
            return 'P';
        case 'PodSecurityPolicy':
            return 'PSP';
        case 'PriorityClass':
            return 'PC';
        case 'ReplicaSet':
            return 'RS';
        case 'Secret':
            return 'Sec';
        case 'Service':
            return 'Sv';
        case 'ServiceAccount':
            return 'SA';
        case 'StorageClass':
            return 'SC';
        default:
            return '?';
        }
    }
});
