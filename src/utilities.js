exports.slugify = (string) => {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
  
    return string.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with 'and'
      .replace(/[^\w\-]+/g, '') // Remove all non-word characters
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
};
exports.dateYmdIncrement = (dateBefore) => {
  // console.log('Incrementing ' + dateBefore);
  // var dateAfter = dateBefore.replace(/-/g, '\/');
  // console.log(dateAfter);
  // var dateAfter = Date.parse(dateAfter);
  // console.log(dateAfter);
  // var dateAfter = dateAfter + (86400000*1.5);
  // console.log(dateAfter);
  // var dateAfter = new Date(dateAfter);
  // console.log(dateAfter);
  // var dateAfter = dateAfter.toISOString();
  // console.log(dateAfter);
  // var dateAfter = dateAfter.substring(0,10);
  // console.log('Result ' + dateAfter);
  // return dateAfter;
  return new Date(Date.parse(dateBefore.replace(/-/g, '\/')) + 129600000).toISOString().substring(0,10);
}
exports.formatForXAxisLabel = (curDate) => {
  if (!curDate) {
    debugger;
    return '--';
  }
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return curDate.substring(8,10) + "-" + monthNames[parseInt(curDate.substring(5,7))-1];
}