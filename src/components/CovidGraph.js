import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {Line} from 'react-chartjs-2';
import {chartOptionsFixed} from '../chartOptions.js'
const pseudoRandomColours = [ 'rgb(0,0,0)', 'rgb(255,0,0)','rgb(0,255,0)','rgb(0,0,255)','rgb(255,0,255)','rgb(128,0,0)','rgb(128,128,0)','rgb(0,128,0)','rgb(128,0,128)','rgb(0,128,128)','rgb(0,0,128)'];
const { dateYmdIncrement, formatForXAxisLabel } = require('../utilities.js');
const areaDataPropertyNamesAll = ['deaths','deathsDoublingDays','cases','casesDoublingDays','recovered','recoveredDoublingDays'];
const chartDataLabelPrefix = {
  'deaths': "Deaths - ",
  'deathsDoublingDays': 'Growth in Deaths - ',
  'cases': 'Cases - ',
  'casesDoublingDays' : 'Growth in Cases - ',
  'recovered': 'Recovered - ',
  'recoveredDoublingDays': 'Recovery Growth - ',
};
const chartDataLabelSuffix = {
  'deaths': " (RHS)",
  'deathsDoublingDays': ' (LHS)',
  'cases': ' (RHS)',
  'casesDoublingDays' : ' (LHS)',
  'recovered': ' (RHS)',
  'recoveredDoublingDays': ' (LHS)',
}
export default function CovidGraph(props) {
  var [ chartData, setChartData ] = useState(false);
  useEffect( () => {
    var xStartDateYmd = false;
    var xEndDateYmd = false;
    var earliestDataFoundYmd = false;
    function fetchData(areaValue) {
      const url = '/data/' + areaValue + '/with';
      if (props.apiPort !== 80) {
        axios.defaults.baseURL = window.location.protocol + "//" + window.location.hostname + ":" + props.apiPort;
      }
      return axios(url);
    }
    var promises = [];
    props.dataSets.forEach( dataSet => {
      promises.push(fetchData(dataSet.value))
    });
    Promise.all(promises)
    .then( allResults =>{
      var newDataForAllAreas = {};
      allResults.forEach(result => {
        const data = result.data;
        if (data) {
          const area = data.area;
          newDataForAllAreas[area] = data;
          if (data.labels && (result.data.labels.length > 0)) {
            const dateYmdFirst = result.data.dateYmd[0];
            const dateYmdLast = result.data.dateYmd[result.data.dateYmd.length-1];
            if (xStartDateYmd === false || (dateYmdFirst < xStartDateYmd)) {
              xStartDateYmd = dateYmdFirst;
            }
            if (xEndDateYmd === false || (dateYmdLast > xEndDateYmd)) {
              xEndDateYmd = dateYmdLast;
            }
            
          }  
        } else {
          props.errorAdd('Data Api response for ' + data.area + ' response did not contain any data...');
        }
      });
      // now pad out the data so they have the same x axis.
      // these variables will be set first time through the loop:
      var areaDataPropertyNames = false;
      var paddedDataForAllAreas = {};
      var chartLabels=[];
      // just get the property names that the API returned - it may be pulling only a subset of the data (eg just deaths):
      var firstArea = true;
      for(let areaValue in newDataForAllAreas) {
        const curAreaData = newDataForAllAreas[areaValue];
        if (areaDataPropertyNames === false) {// first time through the loop when we have a curAreaData data set to interogate
          areaDataPropertyNames = areaDataPropertyNamesAll.filter( propertyName => {
            return Boolean(curAreaData[propertyName])
          });
        }
        if (curAreaData) {
          // Note I COULD have used the existing curAreaData values and pushed at the start and end of the array
          // but when I first wrote this code I pulled the value from a state variable, then put it back using setState,
          // so it had to be a different copy.
          var newAreaData = {
            dateYmd: [],
            labels: [],
            area: areaValue,
            includeDescendants: curAreaData.includeDescendants,
          };
          for (let i in areaDataPropertyNames) {
            const propertyName = areaDataPropertyNames[i];
            newAreaData[propertyName] = [];
          };
          var dateYmd = xStartDateYmd;
          if (!xStartDateYmd) {
            console.log('no data for any selected area');
            
          } else {
            do {
              const dateForLabel = formatForXAxisLabel(dateYmd);
              const curDataIndex = curAreaData.dateYmd.indexOf(dateYmd);
              newAreaData.dateYmd.push(dateYmd);
              newAreaData.labels.push(dateForLabel);
              for (let i in areaDataPropertyNames) {
                const propertyName = areaDataPropertyNames[i];
                newAreaData[propertyName].splice(newAreaData[propertyName].length,0,(curDataIndex === -1) ? null : curAreaData[propertyName][curDataIndex]);
                // see if there are any datum on this day:
                
                if (curAreaData[propertyName][curDataIndex]) {
                  // truthy data, so let's see if it's earlier than the earlist so far:
                  if (earliestDataFoundYmd === false || (earliestDataFoundYmd > dateYmd)) {
                    //console.log('replacing ' + earliestDataFoundYmd + ' with ' + dateYmd + ' becasue property' + propertyName + ' is ' + curAreaData[propertyName][curDataIndex]);
                    earliestDataFoundYmd = dateYmd;
                  }
                };
              }
              dateYmd = dateYmdIncrement(dateYmd);
              if (firstArea) chartLabels.push(dateForLabel);
            } while (dateYmd <= xEndDateYmd)
          }
          firstArea=false;
          paddedDataForAllAreas[areaValue] = newAreaData;
          // now cull all entries before the first entry with zero data:
          if (earliestDataFoundYmd) {
            for(let areaValue in paddedDataForAllAreas) {
              const curAreaData = paddedDataForAllAreas[areaValue];
              const firstDataIndex = curAreaData.dateYmd.indexOf(earliestDataFoundYmd);
              if (firstDataIndex !==-1) {
                if (curAreaData) {
                  curAreaData['dateYmd'].splice(0,firstDataIndex);
                  curAreaData['labels'].splice(0,firstDataIndex);
                  for (let i in areaDataPropertyNames) {
                    const propertyName = areaDataPropertyNames[i];
                    curAreaData[propertyName].splice(0,firstDataIndex);
                  }
                  
                }
              }
            }
            let firstDataIndex = chartLabels.indexOf(formatForXAxisLabel(earliestDataFoundYmd));
            chartLabels.splice(0,firstDataIndex);
          }
        } else {
          console.log('No data found to pad for ' + areaValue);
          props.errorAdd('No data found to pad for ' + areaValue);
        }


        //setDataByAreaValue(paddedDataForAllAreas);
        // make a dataset for each property in each area:
        var chartDatasets = [];
        var colourIndex = 0;
        
        for (let paddedDataIndex in paddedDataForAllAreas) {
          const areaData = paddedDataForAllAreas[paddedDataIndex];
          ['deaths','cases','recovered'].forEach(dataSetKey => {
            if (areaData[dataSetKey]) {
              // data set for this area for deaths:
              let oneChartData = {
                label: chartDataLabelPrefix[dataSetKey] + areaData.area + chartDataLabelSuffix[dataSetKey],
                backgroundColor: pseudoRandomColours[colourIndex],
                borderColor: pseudoRandomColours[colourIndex],
                data: areaData[dataSetKey],
                type:'bar',
                fill:false,
                yAxisID: 'number',
                order: 40, // put bar behind line
              };
              colourIndex = (colourIndex +1 % pseudoRandomColours.length);
              chartDatasets.push(oneChartData);
            }
            if (areaData[dataSetKey + 'DoublingDays']) {
              let anotherChartData = {
                label: chartDataLabelPrefix[dataSetKey + 'DoublingDays'] + areaData.area + chartDataLabelSuffix[dataSetKey],
                fill: false,
                spanGaps:true,
                type: 'line',
                backgroundColor: pseudoRandomColours[colourIndex],
                borderColor: pseudoRandomColours[colourIndex],
                data: areaData[dataSetKey + 'DoublingDays'],
                yAxisID: 'doubling-days',
                order: 20,
              }
              colourIndex = (colourIndex +1 % pseudoRandomColours.length);
              chartDatasets.push(anotherChartData);
            } else {
              console.log('no ' )
              console.log(areaData)
            }
          });
        }
        setChartData({
          datasets: chartDatasets,
          labels: chartLabels
        });
        if (chartDatasets.length > 2) {
          props.messageAdd('Click on any entry in the legend on the right to show / hide individual bars or lines. To hide this message click the \'X\' =>');
        }
        props.setGraphLoading({ graphLoading: false});
      }
    })
    .catch(err =>{
      props.errorAdd('The data source api returned an error: ' + err.message);
    })
  },[props.dataSets, props.apiPort ])
  if (props.graphLoading.graphLoading) {
    return <div>Graph Loading</div>
  }
  return <Line data={chartData} options = {chartOptionsFixed}/>
}
