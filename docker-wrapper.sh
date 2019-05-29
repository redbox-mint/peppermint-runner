#!/bin/bash
cleanup() {
   echo "Peppermint Runner docker stopped/terminated, cleaning up run flag... "
   rm -rf $APP_HOME/tracking/run.flag
}

trap 'true' SIGTERM

if [ "$RUN_AS_CRON" == "false" ]; then
  echo "Peppermint Runner docker starting as foreground command..."
  node index.js --config $CONFIG_PATH &
else
  echo "Peppermint Runner docker starting as cron..."
  cp $APP_HOME/crontab /etc/cron.d/sample-cron
  touch /var/log/cron.log
  cron -f &
fi

wait $!
cleanup
