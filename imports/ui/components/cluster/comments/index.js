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
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';

const postCommentContent = new ReactiveVar(null);

Template.cluster_comments.helpers({
    comments() {
        return (this.cluster.comments || []).reverse();
    },
    postCommentBtnDisplayClass() {
        return (postCommentContent.get() ? '' : 'd-none');
    },
});

Template.cluster_comments.events({
    'keyup .postCommentTextarea': function(event) {
        const content = $(event.target).val();
        postCommentContent.set(content);
    },
    'click .postCommentBtn': function() {
        const content = postCommentContent.get();
        const clusterId = this.cluster.cluster_id;
        Meteor.call('createClusterComment', clusterId, content, (err) => {
            if (err) {
                throw err;
            }
            $('.postCommentTextarea').val('');
            postCommentContent.set('');
        });
    },
});


Template.cluster_comment.onCreated(function() {
    this.autorun(() => {
        this.subscribe('users.byId', Template.currentData().comment.user_id);
    });
});

Template.cluster_comment.helpers({
    authorName() {
        const user = Meteor.users.findOne({ _id: this.comment.user_id });
        if (!user) {
            return '[UNKNOWN USER]';
        }
        return user.profile.name;
    },
    commentHtml() {
        var html = Blaze._escape(this.comment.content);
        html = html.replace(/\n/g, '<br />\n');
        return html;
    }
});
