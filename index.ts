#!/usr/bin/env node

import * as fs from 'fs';
import * as yargs from 'yargs';
import * as axios from 'axios';
import * as _ from 'lodash';

async function crawlFileSystem(configJson) : Promise<void> {
  const sourcePath = _.endsWith(configJson.source, '/') ? configJson.source : `${configJson.source}/` ;
  const peppermintUrl = configJson.peppermintUrl;
  const apiKey = configJson.apiKey;

  console.log(`Processing: ${sourcePath} into ${peppermintUrl}`);

  if (fs.existsSync(sourcePath)) {
    const requestData = {records: []};
    _.each(fs.readdirSync(sourcePath, {withFileTypes: true}), (dirEnt:any) => {
      if (dirEnt.isDirectory()) {
        const entryPath = `${sourcePath}${dirEnt.name}/CATALOG.json`;
        if (fs.existsSync(entryPath)) {
          const entryJson = require(entryPath);
          requestData.records.push(entryJson);
        } else {
          console.error(`CATALOG.json missing: ${entryPath}`);
        }
      } else {
        console.log(`Ignoring, not a directory: ${dirEnt.name}`);
      }
    });
    // console.log(`Request:`);
    // console.log(JSON.stringify(requestData));
    // push to Peppermint
    try {
      let statusMessage = `Successfully processed all records.`;
      // TODO: resolve type def..
      //@ts-ignore
      const response = await axios({url: peppermintUrl, method: 'post', data: requestData, responseType: 'json', headers: {'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json; charset=utf-8'} } );
      if (response.status == 200) {
        let failed = 0;
        _.each(response.data.results, (result:any, index:any) => {
          let hasFailed: boolean = false;
          _.forOwn(result.scripts, (scriptRes:any, scriptName: string) => {
            if (!scriptRes) {
              console.error(`Failed to run script: ${scriptName}`);
              console.error(`Record:`);
              console.error(JSON.stringify(requestData[index]));
              hasFailed = true;
            }
          });
          if (hasFailed) {
            failed++;
          }
        });
        if (failed > 0) {
          statusMessage = `Some records failed processing: ${failed} record(s). Please check logs.`;
        }
      } else {
        statusMessage = "Request failed.";
        console.error(response);
      }
      console.log(statusMessage);
    } catch (err) {
      console.error(`Failed to make request:`)
      console.error(err)
    }
  } else {
    console.error(`Source path doesn't exist: ${sourcePath}`)
  }
}

const argv = yargs.argv;
const configPath = argv.config || './config.json';
if (!fs.existsSync(configPath)) {
  console.error(`Please provide a valid config file path: ${configPath}`);
  process.exit(1);
}
const configJson = require(configPath);
crawlFileSystem(configJson);
