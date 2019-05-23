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
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import Plotly from 'plotly.js-dist';
import '../../components/portlet';
import { Session } from 'meteor/session';


let dataIsLoaded = new ReactiveVar(false);
let noDataFound = new ReactiveVar(false);

Template.clustersByKubeVersion.onCreated( () => {
    dataIsLoaded.set(false);
    Template.instance().title = new ReactiveVar( 'Active clusters by version' );
});

Template.clustersByKubeVersion.helpers({
    title: () => Template.instance().title.get(),
    chartIsLoading: () => {
        return dataIsLoaded.get() ? false : true;
    },
    noData: () => {
        return noDataFound.get() ? true : false;
    },
});

Template.clustersByKubeVersion.onRendered(function() {
    this.autorun(()=>{
        const instance = Template.instance();
        const initalPlotData = [{
            type: 'pie',
            values: [],
            labels: [],
        }];
        const layout = {
            font: {
                family:	'ibm-font',
                size: 12,
                color: '#333',
            },
            margin: {
                l: 20,
                r: 20,
                t: 20,
                b: 20,
                pad: 0,
            },
        };
        let modeBarButtons = [[ 'toImage' ]];
        Meteor.call('getClusterCountByKubeVersion', Session.get('currentOrgId'), (error, data) => {
            dataIsLoaded.set(true);
            if(data.length === 0) {
                noDataFound.set(true);
                layout.height = 50;
                modeBarButtons = null;
            }
            
            data = data.map( d => {
                if ( d.id.version.gitVersion ) {
                    const version = d.id.version.gitVersion.split('.');
                    d.major = version[0];
                    d.minor = version[1];
                    d.patch = version[2];
                }
                else {
                    d.major = 'na';
                    d.minor = 'na';
                    d.patch = '';
                }
                return d;
            });
            if (data){
                const y = data.map(d => d.major + '.' + d.minor);
                const major = data.map(d => d.major);
                const minor = data.map(d => d.minor);
                const patch = data.map(d => d.patch);

                const x = data.map(d => d.count);
                instance.title.set( 'Active clusters by version' );
                const plotdata = [{
                    major: major,
                    minor: minor,
                    patch: patch,
                    values: x,
                    labels: y,
                    textinfo: 'value',
                }];
                Plotly.newPlot('clustersByKubeVersionChart', initalPlotData, layout, {responsive: true, modeBarButtons: modeBarButtons, displaylogo: false });
                Plotly.animate('clustersByKubeVersionChart',
                    {
                        data: plotdata
                    }, {
                        transition: {
                            duration: 500,
                            easing: 'cubic-in-out'
                        },
                        frame: {
                            duration: 500
                        }
                    });
            } 
        });
    });
});
