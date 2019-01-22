#!/bin/bash

if [ "$RUN_AS_CRON" == "false" ]; then
  node index.js --config $CONFIG_PATH
else
  cp $APP_HOME/crontab /etc/cron.d/sample-cron
  touch /var/log/cron.log
  cron && tail -f /var/log/cron.log
fi
