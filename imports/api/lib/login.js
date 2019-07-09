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

import { Meteor } from 'meteor/meteor';
import _ from 'lodash';

// A user can logon with their github id or they can create a local id/password stored in mongo
// `localUser` is used throughout our code so that we can skip calls to the github api for local users
function localUser() {
    if( _.has(Meteor.user(), 'github.orgs') ) {
        return false;
    } else {
        return true;
    }
}

export { localUser };
