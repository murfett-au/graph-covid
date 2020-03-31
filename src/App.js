import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
//import {setCommonChartJsGlobalDefaults} from './commonChartJsGlobalDefaults';
import {Line} from 'react-chartjs-2';

import './App.css';

function App() {
  const dblingAxisFixed = { reverse: true, max: 5, min: 0, stepSize: 1 };
  const dblingAxisNotFixed = { reverse: true };
  var [ areas, setAreas ] = useState(false);
  var [ areaSelectValue, setAreaSelectValue ] = useState(false);
  var [ isLoading, setIsLoading ] = useState(false);
  var [ includeDescendants, setIncludeDescendants] = useState({includeDescendants:false})
  var [ errors, setErrors ] = useState(false);
  var [ dblingAxisTicks, setDblingAxisTicks ] = useState(dblingAxisFixed);
  var [ selectedAreaData, setSelectedAreaData] = useState(false);
  const chartData = {
      labels: selectedAreaData.labels,
      datasets: [{
        label: "Doubling Days",
        fill: false,
        type: 'line',
        borderColor: 'rgb(0,0,255)',
        data: selectedAreaData.doublingDays,
        yAxisID: 'doubling-days',
      },{
        label: "Deaths",
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: selectedAreaData.deaths,
        type:'bar',
        fill:false,
        yAxisID: 'deaths',
      }]
  };
  const defaultAreaSlug = 'spain';
  const chartOptions = {
    responsive: true,
    tooltips: {
      mode: 'label'
    },
    elements: {
      line: {
        fill: false
      }
    },
    scales: {
      
      yAxes: [
        {
          id: 'doubling-days',
          scaleLabel: {
            display: true,
            labelString: 'Deaths Double Every (days)',
          },
          type: 'linear',
          display: true,
          position: 'left',
          
          gridLines: {
            display: true
          },
          labels: {
            show: true
          },
          ticks: dblingAxisTicks
        },
        {
          id: 'deaths',
          scaleLabel: {
            display: true,
            labelString: 'Deaths',
          },
          type: 'linear',
          display: true,
          position: 'right',
          
          gridLines: {
            display: false
          },

        }
      ]
    }
  };
  useEffect(() => {
    const fetchAreasData = async () => {
      setErrors(false);
      setIsLoading(true);
      try {
        
        
        //axios.defaults.baseURL = window.location.protocol + "//" + window.location.hostname + ":81";
        //console.log('BaseURL:',axios.defaults.baseURL);
        const result = await axios('/areas');
        
        if (result.data) {
          var options = [];
          var defaultIndex = false;
          var count=0;
          for(var oneAreaSlug in result.data) {
            const areaLabel = result.data[oneAreaSlug];
            options.push({
              value: oneAreaSlug,
              label: areaLabel,
            });
            if (oneAreaSlug === defaultAreaSlug) {
              defaultIndex = count;
            }
            count++;
          }
          setAreas({areas: options});
          if (defaultIndex !== false) {
            console.log('options[defaultIndex]=' + options[defaultIndex]);
            changeSelectedArea(options[defaultIndex],true,'Setting default');
          }
        } else {
          setErrors(['Api response did not contain any data...']);
        }
      } catch (error) {
        setErrors(['The api call returned the following error:', error.message]);
      }
      setIsLoading(false);
    };
    fetchAreasData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  /**
   * Populate the chart data when the selected area changes:
   */
  useEffect(() => {
    const fetchData = async () => {
      setErrors(false);
      setIsLoading(true);
      const url = '/data/' + areaSelectValue.value + (includeDescendants.includeDescendants?'/with':'/without');
      try {
        
        const result = await axios(url);//{ baseURL: 'http://localhost:81' });
        if (result.data) {
          setSelectedAreaData(result.data)
        
        } else {
          setErrors(['Api ' + url + ' response did not contain any data...']);
        }
      } catch (error) {
        setErrors(['The ' + url + ' api call returned the following error:', error.message]);
      }
      setIsLoading(false);
    };
    // this should not run initially - the useEffect hook that fetches the fetchAreasData will set the default area, casuing this to run
    if (areaSelectValue) {
      fetchData();
    } else {
      console.log('Skipping fetch data until default area is set');
    }
  },[ includeDescendants, areaSelectValue]);

  function changeSelectedArea(reactSelectValue, inclChildren,logToConsole = false) {
    if (logToConsole) {
      console.log("changeSelectedArea(" + reactSelectValue.value + ", " + inclChildren + ") (" + logToConsole +")");
    }
    if (reactSelectValue.value !== areaSelectValue.value) {
      setAreaSelectValue(reactSelectValue);
    }
    if (inclChildren !== includeDescendants.includeDescendants) {
      setIncludeDescendants({includeDescendants:inclChildren});
    }
  }
  
  var graph;
  if (errors && errors.length>0) {
    graph = <div>
      <b>The following errors occured:</b>
      <ul>
        {errors.map( (error,index) => { return <li key={index}>{error}</li>})}
      </ul>
    </div>
  } else if (isLoading) {
    graph = <div className="Loading">Loading</div>;
  } else if (selectedAreaData) {
    graph = <div><Line data={chartData} options = {chartOptions}/></div>;
  } else {
    graph = <div>No Data</div>
  }
  return (
    <div className="App">
      <div className ="Header">COVID-19 Doubling Times</div>
      <div className="Acknowledge"><div>Data Source: John Hopkins University via <a href='https://github.com/CSSEGISandData/COVID-19'>GitHub</a></div></div>
      <div className="Filters">
        <label className='FilterItem' htmlFor='select-areas'>
          Areas:
          <Select
            id='select-areas'
            className="SelectAreas"
            options={areas.areas}
            value={areaSelectValue}
            onChange = { value => {console.log('area changed to ',value);changeSelectedArea(value, includeDescendants.includeDescendants,'onChange select-area')}}
          />
        </label>
        <label
          className='FilterItem'
          htmlFor='include-descendants'
          onClick = {() => changeSelectedArea(areaSelectValue,!includeDescendants.includeDescendants, 'onClick include-descendants')}>
          &nbsp;Include child state and counties
          <input type="checkbox" readOnly checked={includeDescendants.includeDescendants} />
        </label>
      </div>
      <div className="ChartOptions">
        <label
          className='OptionsItem'
          htmlFor='fix-dbling-axis'
          onClick = {() => setDblingAxisTicks(dblingAxisTicks.max ? dblingAxisNotFixed : dblingAxisFixed)}>
          &nbsp;Fix Doubling Rate Axis to 5 days
          <input type="checkbox" id='fix-dbling-axis' readOnly checked={dblingAxisTicks.max} />
        </label>
      </div>
      {graph}
    </div>
  );
}

export default App;
