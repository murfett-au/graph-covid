import React, { useState, useEffect } from 'react';
import CountryStateCountySelect from './components/CountryStateCountySelect';
import Messages from './components/Messages';
import Datasets from './components/Datasets';
import CovidGraph from './components/CovidGraph';
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
  var [ graphLoading, setGraphLoading] = useState({graphLoading: true});
  var [ messages, setMessages ] = useState(["Welcome to John Murfett's Covid-19 analysis tool. Click the X on the right to remove this message"]);
  function addError(error) {
    let newErrors;
    if (errors) {
      newErrors = [...errors];
      newErrors.push(error);
    } else {
      newErrors = [error];
    }
    setErrors(newErrors);
  }
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
          addError('Api response did not contain any data...');
        }
      } catch (error) {
        addError('The api code returned the following error: ' + error.message);
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
  function dataSetAdd(newDataSet) {
    var newDataSets = [...dataSets];
    var addAtIndex = false;
    dataSets.forEach( (existingDataSet,index) => {
      if (existingDataSet.label === newDataSet.label) {
        addAtIndex = index;
        return;
      }
    });
    if (addAtIndex) {
      newDataSets[addAtIndex] = newDataSet;
    } else {
      newDataSets.push(newDataSet);
    }
    setDataSets(newDataSets);
  }
  function dataSetRemove(id) {
    var dsets = [...dataSets];
    dsets.splice(id,1);
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
      messageAdd = {messageAdd}
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
      dataSetRemove={dataSetRemove}
      dataSets = {dataSets}
    />
    {(dataSets.length > 0) ?
    <CovidGraph 
      addError = {addError}
      dataSets = {dataSets}
      apiPort = {apiPort}
      setGraphLoading = {setGraphLoading}
      graphLoading = {graphLoading}
    /> : null}
  </div>
}
export default Covid;
