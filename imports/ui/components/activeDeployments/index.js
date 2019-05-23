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
import { FlowRouter } from 'meteor/kadira:flow-router';
import Plotly from 'plotly.js-dist';
import '../../components/portlet';
import { Session } from 'meteor/session';

let dataIsLoaded = new ReactiveVar(false);
let noDataFound = new ReactiveVar(false);

Template.activeDeployments.helpers({
    chartIsLoading: () => {
        const isFinished = dataIsLoaded.get();
        return isFinished ? false : true;
    },
    noData: () => {
        return noDataFound.get() ? true : false;
    },
}); 

Template.activeDeployments.onRendered(function() {
    this.autorun(()=>{
        dataIsLoaded.set(false);
        Meteor.call('getActiveDepsPerService', Session.get('currentOrgId'), (error, data) => {
            dataIsLoaded.set(true);
            if (data){
                const y = data.map(d => d.id.name);
                const x = data.map(d => d.count);

                const plotdata = [{
                    x,
                    y,
                    type: 'bar',
                    orientation: 'h',
                    marker: {
                        color: '#efc100',
                        opacity: 1,
                    },
                    insidetextfont: {
                        size: 17,
                        color: '#000',
                    },
                    opacity: 1,
                    hoverinfo: 'x+y',
                }];
                const layout = {
                    height: 450,
                    font: {
                        family:	'ibm-font',
                        size: 12,
                        color: '#444',
                    },
                    xaxis: {
                        title: 'Updates',
                        showgrid: true,
                        showticklabels: true,
                        tickmode: 'auto',
                        ticklen: 5,
                        tickwidth: 1,
                        tickcolor: '#444',
                        ticks: 'outside',
                        zeroline: false,
                        autorange: true,
                    },
                    yaxis: {
                        showgrid: true,
                        showticklabels: true,
                        tickmode: 'auto',
                        ticklen: 5,
                        tickwidth: 1,
                        tickcolor: '#444',
                        ticks: 'outside',
                        autorange: true,
                    },
                    bargap: 0.5,
                    margin: {
                        l: 150,
                        r: 20,
                        t: 20,
                        b: 80,
                        pad: 0,
                    },
                };
                let modeBarButtons = [[ 'toImage' ]];
                if(data.length === 0) {
                    noDataFound.set(true);
                    layout.height = 50;
                    layout.xaxis = null;
                    layout.yaxis = null;
                    modeBarButtons = null;
                } 
                Plotly.newPlot('plotlychart', plotdata, layout, {responsive: true, modeBarButtons: modeBarButtons, displaylogo: false });
                document.getElementById('plotlychart').on('plotly_click', function(selected_data){
                    const orgName = FlowRouter.getParam('baseOrgName');
                    const params = { baseOrgName: orgName };
                    const queryParams = { q: selected_data.points[0].y };
                    FlowRouter.go('resources.search', params, queryParams);
                });
            }
        });
    });
});
