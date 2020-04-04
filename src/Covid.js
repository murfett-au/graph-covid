import React, { useState, useEffect } from 'react';
import CountryStateCountySelect from './components/CountryStateCountySelect';
import axios from 'axios';
import './Covid.css';
//import { slugify } from './utilities.js';

const apiPort = process.env.REACT_APP_API_PORT || 80; // gets value of REACT_APP_API_PORT environment valiable.

function Covid() {
  var [ isLoading, setIsLoading ] = useState(false);
  var [ errors, setErrors ] = useState(false);
  var [ countryOptions,setCountryOptions ] = useState(false);
  var [ states,setStates ] = useState(false);
  var [ regions,setRegions ] = useState(false);
  useEffect(() => {
    const fetchAreasData = async () => {
      setErrors(false);
      setIsLoading(true);
      try {
        
        if (apiPort !== 80) {
          axios.defaults.baseURL = window.location.protocol + "//" + window.location.hostname + ":" + apiPort;
        }
        const result = await axios('/csr');
        
        if (result.data) {
          setCountryOptions(result.data.countryOptions);
          setStates(result.data.states);
          setRegions(result.data.regions);
        } else {
          setErrors(['Api response did not contain any data...']);
        }
      } catch (error) {
        setErrors(['The api code returned the following error: ' + error.message]);
      }
      setIsLoading(false);
    };
    fetchAreasData();
  }, []);
  var content;
  if (errors && errors.length>0) {
    content = <div>
      <b>The following errors occured:</b>
      <ul>
        {errors.map( (error,index) => { return <li key={index}>{error}</li>})}
      </ul>
    </div>
  } else if (isLoading) {
    content = <div className="Loading">Loading</div>;
  } else {
    content = <CountryStateCountySelect
      countryOptions= {countryOptions}
      states = {states}
      regions = {regions}
    />
  }
  return <div className='Covid'>
    <div className ="Header">COVID-19 Doubling Times</div>
    <div className="Acknowledge"><div>Data Source: John Hopkins University via <a href='https://github.com/CSSEGISandData/COVID-19'>GitHub</a></div></div>
    {content}
  </div>
}
export default Covid;
