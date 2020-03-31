const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const johnHopkinsDataPath = './johnhopkinsdata/';
const dirNameDailyReports = johnHopkinsDataPath + 'csse_covid_19_daily_reports/';
const fileNamesTimeSeries = {
    cases: 'time_series_covid19_confirmed_global.csv',
    deaths: 'time_series_covid19_deaths_global.csv',
    recovered: 'time_series_covid19_recovered_global.csv'
};
// const monthNamesLong = ["January", "February", "March", "April", "May", "June",
//   "July", "August", "September", "October", "November", "December"
// ];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
const replacements = {
    '"Korea, South"': 'South Korea',
    'Iran (Islamic Republic of)': 'Iran',
    'Republic of Ireland': 'Ireland',
    'Republic of Korea': 'South Korea',
    'Republic of the Congo': 'Congo',
    'Republic of Moldova': 'Moldova',
    '"Gambia, The"' : 'Gambia',
    '"Bahamas, The"': 'Bahamas',
    'View Nam': 'Vietnam',
    'Hong Kong SAR': 'Hong Kong',
}
const statesByCode = require('./states');
const dirNameTimeSeries = johnHopkinsDataPath + 'csse_covid_19_time_series/';
const port = process.env.PORT || 80;
const allowedApiConsumerPort = 3000;
app.use(express.static(path.join(__dirname, 'build')));
app.use(function (req, res, next) {
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:80');
    const host = req.get('host'); // NOTE host is the fqdn:port
    const hostSplit = host.split(':');
    var fqdn;
    if (hostSplit.length == 1) {
      // I am not sure this is needed, it will be if hostname is fqdn[:port]
      fqdn = host;
    } else if (hostSplit.length == 2) {
      fqdn = hostSplit[0];
    } else {
      console.log('Error the host contained multiple colons!');
    }
    //console.log('protocol:',req.protocol,'host:',host,'fqdn:' + fqdn);
    const allowableOrigin = req.protocol + '://' + fqdn + ':' + allowedApiConsumerPort;
    //console.log('allowableOrigin:',allowableOrigin)
    res.setHeader('Access-Control-Allow-Origin', allowableOrigin);
    next();
  });
app.get('/', function(req, res) {
  console.log('/ hit');
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.get('/data/:requestedLocationSlug/:includeDescendants', (req, res) => {
    const requestedLocationSlug = req.params.requestedLocationSlug;
    var includeDescendants;
    switch (req.params.includeDescendants) {
        case 'with':
            includeDescendants = true;
            break;
        case 'without':
            includeDescendants = false;
            break;
        default:
            res.status(400).send('Invalid include descendants - last bit of uri must be either "with" or "without".');
            return;
    }
    console.log('/data/' + requestedLocationSlug + '/', includeDescendants);
    getDataFromDailyReports(requestedLocationSlug, includeDescendants, (error, countriesArray, states, regions, dataByLocationDate) => {
        if (error) {
            res.status(500).send('Internal error occured getting data for ' + requestedLocationSlug)
        } else {
            res.send(dataByLocationDate);
        }
    })
})
app.get('/areas', (req, res) => {
    //getCountriesAndStatesFromTimeSeries( (error, countries, states) => {
    console.log('/areas called');
    getDataFromDailyReports( false, false, (error, countriesArray, states, regions, dataByLocationDate) => {
        if (error) {
            res.status(500).send('Internal error occured getting countries list')
        } else {
            areas = {};
            countriesArray.forEach( country => {
                const countrySlug = slugify(country);
                areas[countrySlug] = country;
                if (states[country]) {
                    states[country].forEach( state => {
                        const stateSlug = countrySlug + '_' + slugify(state);
                        areas[stateSlug] = country + " - " + state;
                        if (regions[country + state]) {
                            regions[country + state].forEach(region => {
                                regionSlug = slugify(region);
                                areas[stateSlug + '_' + regionSlug] = country + " - " + state + " - " + region;
                            });
                        }
                    });
                }
            })
            const ordered = {};
            Object.keys(areas).sort().forEach(function(key) {
              ordered[key] = areas[key];
            });
            console.log('getDataFromDailyReports about to return ' + Object.keys(ordered).length + ' areas');
            res.send(ordered);
        }
    });
});
function getDateFromFileName(fileName) {
    return (fileName.substring(6, 10) + '-' + fileName.substring(0,2) + fileName.substring(2,5))
}
app.get('/dates', (req,res) => {
    getCsvFiles(dirNameDailyReports)
    .then( fileNames => {
        res.send(fileNames.map(getDateFromFileName));
    })
    .catch(err => {
        res.status(500).send(err);
    })
});

function getCsvFiles(dirname) {
    return new Promise((resolve, reject) => {
        fs.readdir(dirname, function(err, fileNamesInDir) {
            if (err) return reject(err);
            return resolve(fileNamesInDir.filter( fileName => { return fileName.substring(fileName.length - 4) === '.csv'}));
        });
  });
}

// function getTimeSeriesFileLines(fileName) {
//     return new Promise( (resolve, reject) => {
//         fs.readFile(dirNameTimeSeries + fileName + ".csv",'utf-8',(err, data) => {
//             if (err) reject(err);
//             console.log('getTimeSeriesFileLines data',data);
//             const lines = data.split("\n");
            
//             // for(var i=0; i<100; i++) {
//             //     console.log(data.charCodeAt(i));
//             // }
//             resolve(lines);
//         });
//     });
// }
// function getCountriesAndStatesFromTimeSeries(callback) {
//     var countries = [];
//     var statesByCountry = {};
//     var getLinePromises = [];
//     for(var type in fileNamesTimeSeries) {
//         const fileName = fileNamesTimeSeries[type];
//         getLinePromises.push(getTimeSeriesFileLines(fileName))
//     }
    
//     Promise.all(getLinePromises)
//     .then(allFileLines => {
//         allFileLines.forEach((lines) => {
//             var firstRow = true;
//             lines.forEach( line => {
//                 if (firstRow) {
//                     firstRow = false;
//                 } else {
//                     const [state, country] = line.split(",",2);
//                     if (country && countries.indexOf(country) === -1) {
//                         countries.push(country);
//                     }
//                     if (state) {
//                         if (statesByCountry[country]) {
//                             if (statesByCountry[country].indexOf(state) === -1) {
//                                 statesByCountry[country].push(state);
//                             } else {
//                                 statesByCountry[country] = [state];
//                             }
//                         } else {
//                             statesByCountry[country] = [state];
//                         }
//                     }
//                 }
//             });
            
//         });
//         callback(false, countries, statesByCountry );
//     })
//     .catch(error  => {
//         console.error(error);
//         callback(error);
//     });
// }
function getDailyReportFileLines(fileName) {
    return new Promise( (resolve, reject) => {
        fs.readFile(dirNameDailyReports + fileName,'utf-8',(err, data) => {
            if (err) reject(err);
            // In Windows this works, but when git pushes it up, it replaces \r\n with 
            const linesRN = data.split("\r\n");// \n is LF, \r is CR \015. Lines have CRLF delimiters in daily reports.
            const lines = data.split("\r");// if we are on linux, after a git push, this will split. On windows, the last split will have removed \r\n so \s.
            //console.log('reading file ' + dirNameDailyReports + fileName + ' which as ' + lines.length + ' lines');
            resolve({
                lines:lines,
                date: getDateFromFileName(fileName),
                fileName: fileName,
            });
        });
    });
}

function getDataFromDailyReports(requestedLocationSlug,includeDescendants,callback) {
    var countries = [];
    var statesByCountry = {};
    var regionsByCountryState = {}
    var dataByLocationDate = {};
    var getLinePromises = [];
    var dateEarliest = false;
    var dateLatest = false;
    getCsvFiles(dirNameDailyReports)
    .then( fileNames => {
        
        fileNames.forEach(fileName => {
            getLinePromises.push(getDailyReportFileLines(fileName));
        });
        Promise.all(getLinePromises)
        .then(allFileLines => {
            allFileLines.forEach(oneFileData => {
                var lines = oneFileData.lines;
                const fileDate = oneFileData.date;
                var firstRow = true;
                var algorithm = false;
                console.log('Looking at ' + lines.length + ' lines in ' + oneFileData.fileName);
                lines.forEach( line => {
                    const origLine = line;
                    
                    line = line.trim();
                    if (firstRow) {
                        firstRow = false;
                        if (line.indexOf('Province/State,Country/Region,Last Update,Confirmed,Deaths,Recovered,Latitude,Longitude')===0) {
                            algorithm = 2;
                        } else if (line.indexOf('Province/State,Country/Region,Last Update,Confirmed,Deaths,Recovered')===0) {
                            algorithm = 1;
                        } else if (line.indexOf('FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key')===0) {
                            algorithm = 3;
                        } else {
                            console.log('Unknown header first row"' + line + "'");
                            algorithm = false;
                        }
                        console.log(lines.length + " lines for date " + fileDate + " algorithm " + algorithm);
                    } else {
                        if (algorithm) {
                            for(strFrom in replacements){
                                if (line.indexOf(strFrom) !== -1) {
                                    line = line.replace(strFrom,replacements[strFrom]);
                                }
                            }
                            if (line) {
                                var state, country, region, lastUpdate, lat, long, confirmed, deaths, recovered, active;
                                var ignore;// this is used to hold the FIPS number that proceeds the country, state and region info on each data line in algorithm 2.
                                // ignore also used to strip off address for "" address case
                                switch (algorithm) {
                                    case 1:
                                    case 2:
                                        // cases:
                                        // quoted region state code, and lat long:
                                        // "Shelby County, TN",US,2020-03-08T16:13:36,1,0,0,35.1269,-89.9253
                                        // region, country and lat long
                                        // Alberta,Canada,2020-03-11T20:00:00,29,0,0,53.9333,-116.5765
                                        // Tasmania,Australia,2020-03-02T20:53:02,1,0,0,-41.4545,145.9707
                                        // and 
                                        // Province/State,Country/Region,Last Update,Confirmed,Deaths,Recovered
                                        // 
                                        active = false; // these formats don't have 'active' data.
                                        const firstInvertedCommaPos = line.indexOf('"');
                                        if ( firstInvertedCommaPos === -1 || firstInvertedCommaPos>3) {
                                            // No inverted commas, or none in the first three charaters, so we assume the format is 
                                            //Inner Mongolia,Mainland China,2020-02-25T23:53:02,75,0,35
                                            // Tasmania,Australia,2020-03-02T20:53:02,1,0,0,-41.4545,145.9707
                                            region = false;
                                            [ state, country, lastUpdate, confirmed, deaths, recovered ] = line.split(",",7);
                                        } else {
                                            // there is a quoted string containing the region and state code:
                                            // "Humboldt County, CA",US,2020-02-21T05:13:09,1,0,0
                                            var secondInvertedCommaPos = line.indexOf('"',firstInvertedCommaPos+1);
                                            const regionAndStateCode = line.substring(firstInvertedCommaPos+1,secondInvertedCommaPos);
                                            
                                            line = 'stateAndCountyRemoved' + line.substring(secondInvertedCommaPos+1);// strip off the first comma-filled region and state code.
                                            
                                            [ignore, country, lastUpdate, confirmed, daths, recovered ] = line.split(",",6);
                                            
                                            var stateCode;
                                            [region, stateCode] = regionAndStateCode.split(",",2);
                                            stateCode = stateCode.trim();
                                            if (statesByCode[stateCode]) {
                                                state = statesByCode[stateCode];
                                            } else {
                                                if (stateCode.indexOf('(From Diamond Princess)') !== -1) {
                                                    if (statesByCode[stateCode.substring(0,2)]) {
                                                        state = statesByCode[stateCode.substring(0,2)] + " (From Diamond Princess)";
                                                    } else {
                                                        state = stateCode;
                                                        
                                                    }
                                                } else if (region.indexOf('Virgin Islands') !== -1) {
                                                    state = "Virgin Islands";
                                                    region = false;
                                                    
                                                } else {
                                                    console.log("**BAD**",country,stateCode,region);
                                                    console.log(origLine);
                                                    state = stateCode + "**";
                                                }
                                            }
                                            // remove the initial quoted string as it contains extra commas:
                                            // const secondInvertedComma = line.indexOf('"',2);
                                            // console.log('before ' + line);
                                            // line = line.substring(0,secondInvertedComma).replace(',',' ') + line.substring(secondInvertedComma+1)
                                            // console.log('after  ' + line);
                                        }
                                            
                                        
                                    break;
                                    case 3:
                                        // eg 17031,Cook,Illinois,US,2020-03-27 22:14:55,41.84144849,-87.81658794,2239,20,0,0,"Cook, Illinois, US"
                                        // eg Grand Princess,Canada,2020-03-11T20:00:00,2,0,0,37.6489,-122.6655
                                        [ignore, region, state, country, lastUpdate, lat, long, confirmed, deaths, recovered, active] = line.split(",",11);
                                        //FIPS,Admin2,Province_State,Country_Region,Last_Update,Lat,Long_,Confirmed,Deaths,Recovered,Active,Combined_Key
                                    break;
                                }
                                var thisDatumLocationSlug = false;
                                if (country && countries.indexOf(country) === -1) {
                                    countries.push(country);
                                }
                                thisDatumLocationSlug = slugify(country);
                                if (state) {
                                    if (statesByCountry[country]) {
                                        if (statesByCountry[country].indexOf(state) === -1) {
                                            statesByCountry[country].push(state);
                                        }
                                    } else {
                                        statesByCountry[country] = [state];
                                    }
                                    thisDatumLocationSlug = thisDatumLocationSlug + "_" + slugify(state);
                                    if (region) {
                                        if (regionsByCountryState[country + state]) {
                                            if (!regionsByCountryState[country + state].indexOf(region) == -1) {
                                                regionsByCountryState[country + state].push(region);
                                            }
                                        } else {
                                            regionsByCountryState[country + state] = [region];
                                        }
                                        thisDatumLocationSlug = thisDatumLocationSlug + "_" + slugify(region);
                                    }
                                }
                                
                                var addDataForThisLocation = false;
                                if (requestedLocationSlug) {
                                    if (requestedLocationSlug === true) {
                                        addDataForThisLocation = true;
                                    } else {
                                        if (requestedLocationSlug == thisDatumLocationSlug) {
                                            addDataForThisLocation = true;
                                        } else {
                                            if (includeDescendants) {
                                                if ( thisDatumLocationSlug.indexOf(requestedLocationSlug + "_") === 0 ) {
                                                    addDataForThisLocation = true;
                                                }
                                            }
                                        }
                                        // may use this code if we make this work for multiple slugs in an array:
                                        // dataLocationSlugs.forEach( slug => {
                                        //     if (includeDescendants) {
                                        //         if ((thisDatumLocationSlug === slug) || thisDatumLocationSlug.indexOf(slug + "_") === 0) {
                                        //             addDataForThisLocation = true;
                                        //         }
                                        //     } else {
                                        //         if (thisDatumLocationSlug === slug) {
                                        //             addDataForThisLocation = true;
                                        //         }
                                        //     }
                                        // });
                                    }
                                    // console.log("Countries:",countries);
                                    // console.log('States by Country',statesByCountry);
                                    if (addDataForThisLocation) {
                                        const confirmedInt = confirmed ? parseInt(confirmed):0;
                                        const deathsInt = deaths ? parseInt(deaths):0;
                                        const recoveredInt = recovered ? parseInt(recovered):0;
                                        if (dateEarliest === false) {
                                            dateEarliest = fileDate;
                                            dateLatest = fileDate;
                                        } else {
                                            if (fileDate < dateEarliest ) {
                                                dateEarliest = fileDate;
                                            }
                                            if (fileDate > dateLatest) {
                                                dateLatest = fileDate
                                            }
                                        }
                                        if (! dataByLocationDate[requestedLocationSlug] ) {
                                            dataByLocationDate[requestedLocationSlug] = {};
                                        }

                                        if (dataByLocationDate[requestedLocationSlug][fileDate]) {
                                            dataByLocationDate[requestedLocationSlug][fileDate].deaths += deathsInt;
                                            dataByLocationDate[requestedLocationSlug][fileDate].confirmed += confirmedInt;
                                            dataByLocationDate[requestedLocationSlug][fileDate].recovered += recoveredInt;
                                        } else {
                                            dataByLocationDate[requestedLocationSlug][fileDate] = {
                                                confirmed: confirmedInt,
                                                deaths: deathsInt,
                                                recovered: recoveredInt,
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                
            });
            
            if (dateEarliest) {
                // add rate of growth data:
                
                var previousDeaths = dataByLocationDate[requestedLocationSlug][dateEarliest].deaths;
                var previousDate = dateEarliest;
                var curDate = dateYmdIncrement(dateEarliest);
                var graphData = {
                    labels: [],
                    deaths: [],
                    doublingDays: [],
                };
                var curDeaths = 0;
                
                while (curDate <= dateLatest) {
                    var doublingDays = null;
                    if (dataByLocationDate[requestedLocationSlug][curDate]) {
                        // data exists for curDate so can do the comparison:
                        const dayDiff = dateYmdDiff(previousDate,curDate);
                        curDeaths = dataByLocationDate[requestedLocationSlug][curDate].deaths;
                        if (curDeaths && previousDeaths) {
                            // console.log("from " + previousDeaths + " to " + curDeaths + " in " + dayDiff + " days:");
                            // console.log('cur/prev:',curDeaths/previousDeaths);
                            // console.log('log:',Math.log(curDeaths / previousDeaths));
                            // console.log('lon2/log:', (Math.LN2/Math.log(curDeaths/previousDeaths)));
                            doublingDays = (Math.LN2/Math.log(curDeaths/previousDeaths)) * dayDiff;
                            dataByLocationDate[requestedLocationSlug][curDate].deathDoublingTime = doublingDays;
                        }
                        previousDeaths = curDeaths;
                        previousDate = curDate;
                    }
                    const curDateFormatted = curDate.substring(8,10) + "-" + monthNames[parseInt(curDate.substring(5,7))-1];
                    graphData.labels.push(curDateFormatted);
                    graphData.deaths.push(curDeaths);
                    graphData.doublingDays.push(doublingDays);
                    
                    curDate = dateYmdIncrement(curDate);
                    
                }
                
            }
            callback(false, countries, statesByCountry, regionsByCountryState,graphData );
        })
        .catch(error  => {
            console.error(error);
            callback(error);
        });
    })
    .catch(err => {
        console.error('Error in getDataFromDailyReports');
        console.error(err);
        callback('error getting csv files in getDataFromDailyReports:');
    });
}
function slugify(string) {
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
}
function dateYmdDiff(dateStart,dateEnd) {
    return Math.floor(
        (
          Date.parse(
            dateEnd.replace(/-/g, '\/')
          ) - Date.parse(
            dateStart.replace(/-/g, '\/')
          )
        ) / 86400000);
}
function dateYmdIncrement(dateBefore) {
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
app.listen(port, () => console.log(`Corona Virus Data API Server listening on port ${port}!`))