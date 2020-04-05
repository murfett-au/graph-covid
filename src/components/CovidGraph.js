import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {Line} from 'react-chartjs-2';
import {chartOptionsFixed} from '../chartOptions.js'
const pseudoRandomColours = [ 'rgb(255,0,0)','rgb(0,255,0)', 'rgb(0,0,255)','rgb(255,255,0)','rgb(0,255,255)','rgb(255,0,255)','rgb(127,0,127)'];
const { dateYmdIncrement, formatForXAxisLabel } = require('../utilities.js');
const areaDataPropertyNamesAll = ['deaths','deathDoublingDays','cases','caseDoublingDays','recovered,recoveredDoublingDays'];
export default function CovidGraph(props) {
  var [ chartData, setChartData ] = useState(false);
  useEffect( () => {
    var xStartDateYmd = false;
    var xEndDateYmd = false;
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
      console.log('All ' + promises.length + ' promises have resolved.');
      var newDataForAllAreas = {};
      allResults.forEach(result => {
        const data = result.data;
        if (data) {
          const area = data.area;
          newDataForAllAreas[area] = data;
          //addData(area,data);
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
          props.addError('Data Api response for ' + data.area + ' response did not contain any data...');
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
          do {
            const dateForLabel = formatForXAxisLabel(dateYmd);
            const curDataIndex = curAreaData.dateYmd.indexOf(dateYmd);
            newAreaData.dateYmd.push(dateYmd);
            newAreaData.labels.push(dateForLabel);
            for (let i in areaDataPropertyNames) {
              const propertyName = areaDataPropertyNames[i];
              newAreaData[propertyName].splice(newAreaData[propertyName].length,0,(curDataIndex === -1) ? null : curAreaData[propertyName][curDataIndex]);
            };
            dateYmd = dateYmdIncrement(dateYmd);
            if (firstArea) chartLabels.push(dateForLabel);
          } while (dateYmd <= xEndDateYmd)
          firstArea=false;
          paddedDataForAllAreas[areaValue] = newAreaData;
        } else {
          console.log('No data found to pad for ' + areaValue);
          props.addError('No data found to pad for ' + areaValue);
        }
        //setDataByAreaValue(paddedDataForAllAreas);
        // make a dataset for each property in each area:
        var chartDatasets = [];
        var colourIndex = 0;
        for (let paddedDataIndex in paddedDataForAllAreas) {
          const areaData = paddedDataForAllAreas[paddedDataIndex];
          if (areaData['deaths']) {
            // data set for this area for deaths:
            let oneChartData = {
              label: "Deaths - " + areaData.area,
              backgroundColor: pseudoRandomColours[colourIndex],
              borderColor: pseudoRandomColours[colourIndex],
              data: areaData.deaths,
              type:'bar',
              fill:false,
              yAxisID: 'deaths',
            };
            colourIndex = (colourIndex +1 % pseudoRandomColours.length);
            chartDatasets.push(oneChartData);
            // one one for the doubling rate:
            let anotherChartData = {
              label: "Death Doubling Days - " + areaData.area,
              fill: false,
              type: 'line',
              backgroundColor: pseudoRandomColours[colourIndex],
              borderColor: pseudoRandomColours[colourIndex],
              data: areaData.deathDoublingDays,
              yAxisID: 'doubling-days',
            }
            colourIndex = (colourIndex +1 % pseudoRandomColours.length);
            chartDatasets.push(anotherChartData);
          }
        }
        setChartData({
          datasets: chartDatasets,
          labels: chartLabels
        });
        props.setGraphLoading({ graphLoading: false});
      }
    })
    .catch(err =>{
      props.addError('The data source api returned an error: ' + err.message);
    })
  },[props.dataSets, props.apiPort ])
  if (props.graphLoading.graphLoading) {
    return <div>Graph Loading</div>
  }
  return <Line data={chartData} options = {chartOptionsFixed}/>
}
