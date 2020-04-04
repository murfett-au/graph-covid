import React from 'react';

export default function Messages(props) {
  if ((!props.messages) || props.messages.length === 0) {
    return null
  }
  var retMessages = [];
  props.messages.forEach((message,key) => {
    retMessages.push(
    <div key={key} className={'Message ' + (props.areErrors ? 'MessageErr' : 'MessageMsg')}>
      <span>{message}</span>
      {props.dismiss ? <div onClick={() => props.dismiss(key)}>×</div>:null}
    </div>)
  });
  return (<div>{retMessages}</div>)
}