#!/usr/bin/env node

import * as fs from 'fs';
import * as yargs from 'yargs';
import * as axios from 'axios';
import * as _ from 'lodash';

async function crawlFileSystem(configJson) : Promise<void> {
  const sourcePath = _.endsWith(configJson.source, '/') ? configJson.source : `${configJson.source}/` ;
  const peppermintUrl = configJson.peppermintUrl;
  const apiKey = configJson.apiKey;
  // create the run file, refuse to run if exists...
  const runFlag = configJson.runFlag;
  if (fs.existsSync(runFlag)) {
    console.error(`Refusing to run...seems to be already running, run flag exists: ${runFlag}`);
    return;
  }
  fs.closeSync(fs.openSync(runFlag, 'w'));
  console.log(`Processing: ${sourcePath} into ${peppermintUrl}`);
  if (fs.existsSync(sourcePath)) {
    let requestData = { records: [] };
    let rec_ids = [];
    const batchData = { batches: [], batch_rec_ids: [] };
    _.each(fs.readdirSync(sourcePath, {withFileTypes: true}), (dirEnt:any) => {
      if (dirEnt.isDirectory()) {
        const entryPath = `${sourcePath}${dirEnt.name}/CATALOG.json`;
        if (fs.existsSync(entryPath)) {
          // simple check if this had been processed
          const checkPath = `${configJson.trackingDir}/${dirEnt.name}`;
          if (!fs.existsSync(checkPath)) {
            const entryJson = require(entryPath);
            requestData.records.push(entryJson);
            rec_ids.push(dirEnt.name);
            console.debug(`Added: ${entryPath}`);
            if (requestData.records.length >= configJson.maxRecordsPerRequest) {
              batchData.batches.push(requestData);
              batchData.batch_rec_ids.push(rec_ids);
              requestData = {records: []};
              rec_ids = [];
            }
          } else {
            console.debug(`Record already processed: ${entryPath}`);
          }
        } else {
          console.error(`CATALOG.json missing: ${entryPath}`);
        }
      } else {
        console.log(`Ignoring, not a directory: ${dirEnt.name}`);
      }
    });
    if (batchData.batches.length == 0) {
      batchData.batches.push(requestData);
      batchData.batch_rec_ids.push(rec_ids);
    }
    // console.log(`Request:`);
    // console.log(JSON.stringify(requestData));
    // push to Peppermint
    try {
      let statusMessage = `Successfully processed all records.`;
      for (var ctr=0; ctr<batchData.batches.length; ctr++) {
        console.log(`Processing batch: ${ctr} of ${batchData.batches.length}`);
        // TODO: resolve type def..
        //@ts-ignore
        const response = await axios({url: peppermintUrl, method: 'post', data: batchData.batches[ctr], responseType: 'json', headers: {'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json; charset=utf-8'} } );
        if (response.status == 200) {
          let failed = 0;
          _.each(response.data.results, (result:any, index:any) => {
            let hasFailed: boolean = false;
            _.forOwn(result.scripts, (scriptRes:any, scriptName: string) => {
              if (!scriptRes.success) {
                console.error(`Failed to run script: ${scriptName}`);
                console.error(`Record:`);
                console.error(JSON.stringify(requestData.records[index]));
                hasFailed = true;
              }
            });
            if (hasFailed) {
              failed++;
            } else {
              const checkPath = `${configJson.trackingDir}/${batchData.batch_rec_ids[ctr][index]}`;
              fs.closeSync(fs.openSync(checkPath, 'w'));
            }
          });
          if (failed > 0) {
            statusMessage = `Some records failed processing: ${failed} record(s). Please check logs.`;
          }
        } else {
          statusMessage = "Request failed.";
          console.error(response);
        }
      }
      console.log(statusMessage);
    } catch (err) {
      console.error(`Failed to make request:`)
      console.error(err)
    }
  } else {
    console.error(`Source path doesn't exist: ${sourcePath}`)
  }
  fs.unlinkSync(runFlag);
}

const argv = yargs.argv;
const configPath = argv.config || './config.json';
if (!fs.existsSync(configPath)) {
  console.error(`Please provide a valid config file path: ${configPath}`);
  process.exit(1);
}
const configJson = require(configPath);
crawlFileSystem(configJson);
