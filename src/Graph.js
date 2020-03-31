import React,{useEffect} from 'react';
import {setCommonChartJsGlobalDefaults} from './commonChartJsGlobalDefaults';
export default function Graph(props) {
  
  var Chart = require('chart.js');
  //require('chartjs-plugin-annotation');// Require annotation plugin which allows us to put a line on the chart (eg to indicate the average value)
  // Set initial chart global values:
  setCommonChartJsGlobalDefaults(Chart);

}