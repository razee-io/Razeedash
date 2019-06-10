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

import './component.html';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';

Template.commitLink.helpers({
    gitData() {
        const resourceData = JSON.parse(this.resource.data);
        if(resourceData && resourceData.metadata && resourceData.metadata.annotations) {
            const annotations = resourceData.metadata.annotations;
            // we need to split on the '/' character in the metadata -> annotations keys 
            // to see which annotations are for commit-sha and git-repo.
            // "metadata": {
            //    "annotations": {
            //        "deployment.kubernetes.io/revision": "1",
            //        "razee.io/commit-sha": "64b7bbaaf97fdded24b86b9c1dd1a95cb3aa59f8",
            //        "razee.io/git-repo": "https://github.com/razee-io/Watch-keeper.git",
            //    }
            // }
            let gitRepo;
            let commitSHA;
            for (const fullKey in annotations) {
                const key = fullKey.split('/');
                if(key[1] === 'commit-sha') {
                    commitSHA = annotations[fullKey];
                }
                if(key[1] === 'git-repo') {
                    gitRepo = annotations[fullKey];
                }
            }
            if(gitRepo && commitSHA) {
                return {
                    'link': gitRepo.split('.git')[0] + '/commit/' + commitSHA,
                    'text': Blaze._globalHelpers.trimCommit(commitSHA)
                };
            } else {
                return null;
            }
        } else {
            return null;
        } 
    }, 
});
