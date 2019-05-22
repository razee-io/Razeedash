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

import React from 'react';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import { Meteor } from "meteor/meteor";
import { withTracker } from 'meteor/react-meteor-data';

var curTime = new ReactiveVar();
curTime.set(new Date());
Meteor.setInterval(function() {
    curTime.set(new Date());
}, 10000);

class MomentComponent extends React.Component{
    render(){
        var curTime = this.props.curTime;
        var datetime = this.props.datetime;
        if (!datetime || datetime === '--' || datetime === '') return '';
        if(moment(datetime).isAfter(curTime)){
            datetime = curTime.get();
        }
        return moment(datetime).from(curTime);
    }
}

export default withTracker((props)=>{
    return {
        curTime: curTime.get(),
        ...props,
    };
})(MomentComponent);
