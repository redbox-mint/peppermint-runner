# Peppermint Runner [![Build Status](https://travis-ci.org/redbox-mint/peppermint-runner.svg?branch=master)](https://travis-ci.org/redbox-mint/peppermint-runner)

Source of truth integrator for [Peppermint](https://github.com/redbox-mint/peppermint).

## Architecture

See [Peppermint](https://github.com/redbox-mint/peppermint).

## Running

### Quick set up

- Install docker-compose
- Clone [Peppermint](https://github.com/redbox-mint/peppermint/) and this repo under the same directory.
- Run using [Peppermint's docker-compose.yml](https://github.com/redbox-mint/peppermint/blob/master/docker-compose.yml): `docker-compose up`

The runner will start harvesting 'crawling' the Datacrate directory specified in [config.docker.json](https://github.com/redbox-mint/peppermint-runner/blob/master/config.docker.json).

### Running using Docker without docker-compose
Run `docker run --rm -v <path to datacrate directory>/:<path specified as 'source' in config file> -v <host config file>:/opt/peppermint-runner/config.json -e "RUN_AS_CRON=true" [ if peppermint target is a docker instance: --network=<network name>] qcifengineering/peppermint-runner:latest`.

E.g. `docker run --rm -v /mnt/data/publication/public/:/mnt/data/publication/public/ -v /home/vagrant/source/peppermint-runner/config.docker.json:/opt/peppermint-runner/config.json -e "RUN_AS_CRON=true" --network=peppermint_default qcifengineering/peppermint-runner:latest`

### Running as standalone, without Peppermint, Docker, etc.
- Perform 'Developing' quick set up below
- Run `node index.js` or `node index.js --config <path to config>`

## Customising
- Edit config.json
- Edit crontab

## Developing

### Quick set up
- Clone branch you are developing against (e.g. master)
- Install [Node](https://nodejs.org/en/) version 10.15
- Install [Yarn](https://yarnpkg.com/lang/en/docs/install/#mac-stable)
- Run `yarn install`
- After making changes, run `npm run-script compile` if you don't have editor that supports `tsconfig.json`.
- Follow 'Running as standalone' above
