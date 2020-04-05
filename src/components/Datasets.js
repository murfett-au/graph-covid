import React from 'react';
import Messages from './Messages';
export default function Datasets(props) {
  
  if (props.dataSets && props.dataSets.length > 0) {
    var array=[];
    props.dataSets.forEach( (dataSet,dataSetIndex) => {

      array.push(
      <div key={dataSetIndex} className='DataSetListOne'>
        {dataSet.label}
        <button className="RemoveButton" onClick={() => props.dataSetRemove(dataSetIndex)}>Remove</button>
      </div>);
    });
    return <div><div className='DataSetsHeading'>Included Data:</div>{array}</div>
  } else {
    return <Messages messages={["No data selected. Please select a country and other data above, and click 'Add to graph'."]} />
  }
}