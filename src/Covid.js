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
  useEffect(() => {
    const fetchAreasData = async () => {
      setErrors(false);
      setIsLoading(true);
      try {
        
        if (apiPort !== 80) {
          axios.defaults.baseURL = window.location.protocol + "//" + window.location.hostname + ":" + apiPort;
        }
        const result = await axios('/csc');
        
        if (result.data) {
          setCountryOptions(result.data.countryOptions);
          setStates(result.data.states);
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

  if (errors && errors.length>0) {
    return <div>
      <b>The following errors occured:</b>
      <ul>
        {errors.map( (error,index) => { return <li key={index}>{error}</li>})}
      </ul>
    </div>
  } else if (isLoading) {
    return <div className="Loading">Loading</div>;
  } else {
    return <CountryStateCountySelect
      countryOptions= {countryOptions}
      states = {states}
    />
  }
}
export default Covid;
