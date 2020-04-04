import React, { useState, useEffect } from 'react';
import CountryStateCountySelect from './components/CountryStateCountySelect';
import Messages from './components/Messages';
import Datasets from './components/Datasets';
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
  var [ dataSets, setDataSets ] = useState([]);
  var [ messages, setMessages ] = useState(["Welcome to John Murfett's Covid-19 analysis tool"]);

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
  function messageAdd(message) {
    var msgs = [...messages];
    msgs.push(message);
    setMessages(msgs);
  }
  function removeMessage(id) {
    console.log(id);
    var msgs = [...messages];
    msgs.splice(id,1);
    setMessages(msgs);
  }
  function dataSetAdd(dataSet) {
    var newDataSet = dataSets;
    dataSets.forEach(dataSet => {
      if (dataSet.area === newDataSet.area) {
        messageAdd('You already have a data set for that area, please remove the existing data set before adding this one.');
        return;
      }
    });
    newDataSet.push(dataSet);
    setDataSets(newDataSet);
  }
  function dataSetRemove(id) {
    var dsets = dataSets;
    dataSets.splice(id,1);
    setDataSets(dsets);
  }
  var content = null;
  if (isLoading) {
    content = <div className="Loading">Loading</div>;
  } else {
    content = <CountryStateCountySelect
      countryOptions= {countryOptions}
      states = {states}
      regions = {regions}
      addToGraph = {dataSetAdd}
    />
  }
  return <div className='Covid'>
    <div className ="Header">COVID-19 Doubling Times</div>
    <div className="Acknowledge"><div>Data Source: John Hopkins University via <a href='https://github.com/CSSEGISandData/COVID-19'>GitHub</a></div></div>
    {content}
    <Messages
      areErrors={true}
      messages = {errors}
    />
    <Messages
      dismiss={removeMessage}
      areErrors = {false}
      messages = {messages}
    />
    <Datasets
      dimiss={dataSetRemove}
      dataSets = {dataSets}
    />
  </div>
}
export default Covid;
