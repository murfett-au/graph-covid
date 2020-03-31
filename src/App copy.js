import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from 'axios';
import './App.css';

function App() {
  var [ areas, setAreas ] = useState(false);
  var [ areaSlug, setAreaSlug ] = useState(false);
  var [ isLoading, setIsLoading ] = useState(false);
  var [ includeDescendents, setIncludeDescendents] = useState({includeDescendents:true})
  var [ errors, setErrors ] = useState(false);

  var [ chartData, setChartData] = useState({

  })
  useEffect(() => {
    const fetchAreasData = async () => {
      setErrors(false);
      setIsLoading(true);
      try {
        const result = await axios('/areas',{ baseURL: 'http://localhost:81' });
        console.log(result);
        if (result.data) {
          var options = [];
          for(var areaSlug in result.data) {
            options.push({
              value: areaSlug,
              label: result.data[areaSlug],
            });
          }
          setAreas({areas: options});
          setAreaSlug({areaSlug:'australia'});
        } else {
          setErrors(['Api response did not contain any data...']);
        }
      } catch (error) {
        setErrors(['The api call returned the following error:', error.message]);
      }
      setIsLoading(false);
    };
    fetchAreasData();
  }, []);
  return (
    <div className="App">
      <div className ="Header">COVID-19 Doubling Times</div>
      <div className="Acknowledge"><div>Data Source: John Hopkins University via <a href='https://github.com/CSSEGISandData/COVID-19'>GitHub</a></div></div>
      <div className="Filters">
        <label className='FilterItem' for='select-areas'>Areas:<Select id='select-areas' className="SelectAreas" options={areas.areas} /></label>
        <label className='FilterItem' for='include-descendants'>&nbsp;Include child state and counties<input type="checkbox" checked={includeDescendents.includeDescendents} onChange={() => setIncludeDescendents({includeDescendents: !includeDescendents.includeDescendents})}></input></label>
      </div>
      <div className="Graph">Graph</div>
    </div>
  );
}

export default App;
