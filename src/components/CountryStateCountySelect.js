import React, { useState } from 'react';
import Select from 'react-select';
const { slugify } = require('../utilities.js');
export default function CountryStateCountySelect(props) {
  const includeAll = { label: '-- Include All --',value: ''};
    const [ selectedCountry, setSelectedCountry ] = useState({country: {label:'Australia', value:'australia'}});
    const [ selectedState, setSelectedState ] = useState({state:includeAll});
    const [ selectedRegion, setSelectedRegion ] = useState({region: null});
    const [ inclCases, setInclCases ] = useState({ cases: true});
    const [ inclDeaths, setInclDeaths ] = useState({ deaths: true});
    const [ inclRecovered, setInclRecovered ] = useState({ recovered: true })
    
    /**
     * changeGeography is one function called by changes to country, state and county,
     * to allow centralised common code.
     */
    const changeGeography = (changeWhat,newValue) => {
      switch (changeWhat) {
        case 'country':
          setSelectedCountry({ country: newValue });
          setSelectedState({state:null})
          setSelectedRegion({region: null})
        break;
        case 'state':
          setSelectedState({ state: newValue });
          setSelectedRegion({ region: null});
          break;
        case 'region':
          setSelectedRegion({region: newValue});
          break;
        default:
          console.log('invalid ' + changeWhat);
          break;
      }
    }
    const toggleIncl = (which) => {
      switch(which) {
        case 'cases':
          if (inclCases.cases) {
            if (!(inclDeaths.deaths || inclRecovered.recovered )) setInclDeaths({deaths:true});
            setInclCases({cases:false});
          } else {
            setInclCases({cases:true});
          }
        break;
        case 'deaths':
          if (inclDeaths.deaths) {
            if (!( inclCases.cases || inclRecovered.recovered )) setInclCases({cases: true});
            setInclDeaths({deaths: false});
          } else {
            setInclDeaths({deaths: true});
          }
        break;
        case 'recovered':
          if (inclRecovered.recovered) {
            if (!( inclCases.cases || inclDeaths.deaths )) setInclCases({cases: true});
            setInclRecovered({recovered: false});
          } else {
            setInclRecovered({recovered: true});
          }
        break;
        default:
          console.log('invlaid:' + which);
        break;
      }
    }
    const styleSelectCountry = {
      container: provided => ({
        ...provided,
        width: 175
      })
    };
    const styleSelectState = {
      container: provided => ({
        ...provided,
        width: 175
      })
    };
    const styleSelectRegion = {
      container: provided => ({
        ...provided,
        width: 175
      })
    };
    const addToGraph = ()=>{
      var dataSet = {
        include:{
          cases: inclCases.cases,
          deaths: inclDeaths.deaths,
          recovered: inclRecovered.recovered
        },
      };
      var value = '';
      var label = '';
      if (selectedCountry.country) {
        dataSet.country = selectedCountry.country;
        value = selectedCountry.country.value;
        label = selectedCountry.country.label;
        if (selectedState.state) {
          dataSet.state  = selectedState.state;
          if (selectedState.state.value !== '') {
            value += '_'   + selectedState.state.value;
            label += ' - ' + selectedState.state.label
            if (selectedRegion.region) {
              dataSet.region = selectedRegion.region;
              if (selectedRegion.region.value !== '') {
                value += '_'   + selectedRegion.region.value;
                label += ' - ' + selectedRegion.region.label;
              }
            } else {
              dataSet.region = null;
            }
          }
        } else {
          dataSet.state = null;
        }
      } else {
        props.messageAdd('Add to graph button should not be displayed when no country selected!');
        return;
      }
      dataSet.value = value;
      dataSet.label = label;
      props.addToGraph(dataSet);
    };
      
    
    if (props.countryOptions) {
      var checkboxes = <div className='WhatData' key='WhatData'>
        <label className='WhatDatum' htmlFor='cases' onClick={()=>{toggleIncl('cases')}}>
          <input className='WhatDatum' type='checkbox' checked={inclCases.cases} readOnly />
          Cases
        </label>
        <label className='WhatDatum' htmlFor='recovered' onClick={()=>{toggleIncl('recovered')}}>
          <input className='WhatDatum' type='checkbox' checked={inclRecovered.recovered} readOnly />
          Recovered
        </label>
        <label className='WhatDatum' htmlFor='deaths' onClick={()=>{toggleIncl('deaths')}}>
          <input className='WhatDatum' type='checkbox' checked={inclDeaths.deaths} readOnly />
          Deaths
        </label>
        
      </div>
        var geographyItems = [checkboxes];
        
        geographyItems.push(<label key='country' className='GeographyItem' htmlFor='select-country'>
          <span className='GeographyLabel'>Country:</span>
          <Select
            id='select-country'
            className='GeographySelect'
            options={props.countryOptions}
            value={selectedCountry.country}
            onChange = { value => {changeGeography('country',value)}}
            styles = {styleSelectCountry}
          />
        </label>);
        if (selectedCountry.country && props.states[selectedCountry.country.label]) {
            var stateOptions = [includeAll];
            props.states[selectedCountry.country.label].forEach( (state) => {
              const slug = slugify(state);
              stateOptions.push({ value:slug, label:state});
            });
            geographyItems.push(<label key='state' className='GeographyItem' htmlFor='select-state'>
            <span className='GeographyLabel'>State:</span>
            <Select
              styles={styleSelectState}
              id='select-state'
              className='GeographySelect'
              options={stateOptions}
              value={selectedState.state}
              onChange = { value => {changeGeography('state', value)}}
              
            />
            </label>);
            
            if (selectedState.state && (props.regions[selectedCountry.country.label + selectedState.state.label])) {
              var regionOptions = [includeAll];
              props.regions[selectedCountry.country.label + selectedState.state.label].forEach( (region) => {
                const slug = slugify(region);
                regionOptions.push({ value: slug, label:region})
              });
              geographyItems.push(<label key='region' className='GeographyItem' htmlFor='select-region'>
                <span className='GeographyLabel'></span>
                <Select
                  styles = {styleSelectRegion}
                  id='select-region'
                  className='GeographySelect'
                  options = {regionOptions}
                  value = {selectedRegion.region}
                  onChange = { value => {changeGeography('region',value)}}
                />
              </label>);
            }
        }
        if (selectedCountry.country) {
          geographyItems.push(<button className='GeographyButton' key='addButton' onClick={()=>addToGraph()}>Add to graph</button>)
        }
        return <div className='GeographyItems'>{geographyItems}</div>;
    } else {
        return <div>Loading countries....</div>
    }
}