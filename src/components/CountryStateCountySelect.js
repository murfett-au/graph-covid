import React, { useState } from 'react';
import Select from 'react-select';
export default function CountryStateCountySelect(props) {
    const [ selectedCountry, setSelectedCountry ] = useState({country: false});
    const [ selectedState, setSelectedState ] = useState({state:0});
    // const [ selectedCounty, setSelectedCounty ] = useState({county: 0});
    
    /**
     * changeGeography is one function called by changes to country, state and county,
     * to allow centralised common code.
     */
    const changeGeography = (changeWhat,newValue) => {
        switch (changeWhat) {
            case 'country':
                setSelectedCountry({ country: newValue });
            break;
            case 'state':
                setSelectedState({ state: newValue });
                break;
            default:
                break;
        }
    }
    const countrySelectStyles = {
        container: provided => ({
          ...provided,
          width: 175
        })
      };
    if (props.countryOptions) {
        var selects = [];
        selects.push(<label key='country' className='GeographyItem' htmlFor='select-country'>
          Country:
          <Select
            id='select-country'
            className='SelectGeography'
            options={props.countryOptions}
            value={selectedCountry.country}
            onChange = { value => {console.log('Country changed to ',value);changeGeography('country',value)}}
            styles = {countrySelectStyles}
          />
        </label>);
        if (selectedCountry.country && props.states[selectedCountry.country.label]) {
            var stateOptions = [];
            props.states[selectedCountry.country.label].forEach( (state,value) => {
                stateOptions.push({ value, label:state});
            });
            console.log(stateOptions);
            selects.push(<label key='state' className='GeographyItem' htmlFor='select-state'>
            Country:
            <Select
              id='select-state'
              className='SelectGeography'
              options={stateOptions}
              value={selectedState.country}
              onChange = { value => {console.log('State changed to ',value);changeGeography('state',value)}}
              
            />
            </label>);
        }
        return selects;
    } else {
        return <div>Loading countries....</div>
    }
}