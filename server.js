const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const {slugify, dateYmdIncrement, formatForXAxisLabel}  = require('./src/utilities.js');
const johnHopkinsDataPath = './johnhopkinsdata/';
const dirNameDailyReports = johnHopkinsDataPath + 'csse_covid_19_daily_reports/';
// const fileNamesTimeSeries = {
//     cases: 'time_series_covid19_confirmed_global.csv',
//     deaths: 'time_series_covid19_deaths_global.csv',
//     recovered: 'time_series_covid19_recovered_global.csv'
//};
// const monthNamesLong = ["January", "February", "March", "April", "May", "June",
//   "July", "August", "September", "October", "November", "December"
// ];
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
    '" Norfolk County': '"Norfolk County',
    " County,":",",
    'Mainland China' : 'China',
}
const statesByCode = require('./states');
//const dirNameTimeSeries = johnHopkinsDataPath + 'csse_covid_19_time_series/';
/**
 * PORTS
 * 
 * We need to know:
 *  1) in this server.js file:
 *    1.1) What port to listen for inbound HTTP GETs on
 *    1.2) What port to use in the Access-Control-Allow-Origin to allow local dev env to have create-react-app server running on a different port to the server.js
 *  2) in React Client:
 *    2.1) What port to send API requests to.
 * 
 * OS Environment Variables are used to store the port numbers used by the API and the client.
 * 
 * On local dev environment, process.env.REACT_APP_API_PORT is defined by the create-react-app
 * to give the react port number.
 * 
 * Heroku uses port forwarding from port 80 to arbritrary ports for its many processes. On node.js on heroku, 
 * process.env.PORT is defined to tell this server.js what port incoming requests are being forwarded to.
 * 
 * To set the process.env.PORT in local dev environment, we would define a PORT environment variable.
 * BUT we can't use PORT env var as that also tells creat-react-app what port to run on, creating a conflict
 * as bother server.js and create-react-app want to run on the same port.
 * 
 * So we find what we need to know:
 * 1) in this server.js file:
 *   1.1) Listen On: If process.env.REACT_APP_API_PORT is truthy, use it, if not use process.env.PORT
 *   1.2) If process.env.REACT_APP_API_PORT is truthy, use 3000, if not use process.env.PORT
 * 2) in React Client:
 *   2.1) If process.env.REACT_APP_API_PORT is truthy, use 5000, if not use same port you are running on
 */
const reactAppApiPort = process.env.REACT_APP_API_PORT;
console.log('reactAppApiPort=' + reactAppApiPort);
const clientPort = reactAppApiPort ? 3000 : process.env.PORT;
const serverPort = (reactAppApiPort ? reactAppApiPort : process.env.PORT);
console.log("Client Port:" + clientPort + "; Server Port: " + serverPort + ";");
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
    console.log('protocol:',req.protocol,'host:',host,'fqdn:' + fqdn);
    
    const allowableOrigin = req.protocol + '://' + fqdn + ':' + clientPort;
    console.log('allowableOrigin:',allowableOrigin)
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
app.get('/csr', (req,res) => {
    console.log('/csr country state county called');
    getDataFromDailyReports( false, false, (error, countriesArray, statesByCountryArray, regionsByCountryStateArray, dataByLocationDate) => {
        if (error) {
            res.status(500).send('Internal error occured getting countries states counties list')
        } else {
            countryOptions = [];
            const ordered = {};
            Object.keys(countriesArray).sort().forEach(function(key) {
              ordered[key] = countriesArray[key];
            });
            countriesArray.sort().forEach( country => {
                const value = slugify(country);
                countryOptions.push({
                    value: value,
                    label: country
                });
            });
            for(var country in statesByCountryArray) {
                statesByCountryArray[country] = statesByCountryArray[country].sort();
            }
            for (var countryState in regionsByCountryStateArray) {
                regionsByCountryStateArray[countryState] = regionsByCountryStateArray[countryState].sort();
            }
           
            
            // Object.keys(states).sort().forEach(function(key) {
            //   statesSorted[key] = states[key];
            // });
            // var regionsSorted = {};
            // Object.keys(regions).sort().forEach(function(key) {
            //     regionsSorted[key] = regions[key];
            //   });
            res.send({
                countryOptions,
                states: statesByCountryArray,
                regions: regionsByCountryStateArray
            });
        }
    });
});
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

function getDailyReportFileLines(fileName) {
    return new Promise( (resolve, reject) => {
        fs.readFile(dirNameDailyReports + fileName,'utf-8',(err, data) => {
            if (err) reject(err);
            // In Windows this works, but when git pushes it up, it replaces \r\n with 
            const linesRN = data.split("\r\n");
            const linesR = data.split("\n");
            const lines = (linesRN.length > linesR.length ? linesRN : linesR);
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
            //var count1 = 0;
            allFileLines.forEach(oneFileData => {
                var lines = oneFileData.lines;
                const fileDate = oneFileData.date;
                var firstRow = true;
                var algorithm = false;
                // if (count1 < 9) {
                //     for (var i=66;i<71; i++) {
                //         console.log(lines[0].charAt(i)+": " + lines[0].charCodeAt(i));
                //     }
                //     count1++;
                // }
                // if (lines[0].length > 1000) {
                    
                // }
                // console.log('Looking at ' + lines.length + ' lines in ' + oneFileData.fileName + ". first line is " + lines[0].length + " chars long");
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
                        //console.log(lines.length + " lines for date " + fileDate + " algorithm " + algorithm);
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
                                            if (regionsByCountryState[country + state].indexOf(region) == -1) {
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
                    deathDoublingDays: [],
                    dateYmd: [],
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
                    const curDateFormatted = formatForXAxisLabel(curDate);
                    graphData.area = requestedLocationSlug;
                    graphData.labels.push(curDateFormatted);
                    graphData.deaths.push(curDeaths);
                    graphData.doublingDays.push(doublingDays);
                    graphData.deathDoublingDays.push(doublingDays);
                    graphData.dateYmd.push(curDate);
                    graphData.includeDescendants = includeDescendants;
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

app.listen(serverPort, () => console.log(`Corona Virus Data API Server listening on port ${serverPort} for requests from port ${clientPort}!`))