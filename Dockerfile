FROM node:10.15

ENV APP_HOME /opt/peppermint-runner
ENV CONFIG_PATH ./config.json
ENV RUN_AS_CRON false

COPY . $APP_HOME/
RUN cd $APP_HOME && yarn install && npm run-script compile && chmod +x docker-wrapper.sh

RUN apt-get update
RUN apt-get -y install cron

WORKDIR $APP_HOME
ENTRYPOINT ["sh", "-c"]
CMD ["exec ./docker-wrapper.sh"]
