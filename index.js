#!/usr/bin/env node

const amqp = require('amqplib/callback_api');
const config = require('./config');

const serverUrl = `${config.rabbitmq.protocol}://${config.rabbitmq.hostname}`;

amqp.connect(serverUrl, function(err, conn) {
    conn.createChannel(function(err, ch) {

        const exchangeName = config.rabbitmq.exchangeName;
        const routingKey = config.rabbitmq.routingKey;

        const messageTemplate = config.message.template;
        const values = config.message.values;

        ch.assertExchange(exchangeName, 'direct', config.rabbitmq.options);

        let counter = 0;

        const repeat = setInterval(function() {
            const msg = injectArgs(messageTemplate, values);
            ch.publish(exchangeName, routingKey, new Buffer(msg));
            console.log("%d - [x] Sent %s", counter, msg);

            if(++counter >= config.message.number) {
                clearInterval(repeat);
                conn.close();
                process.exit(0);
            }
        }, config.message.delay);
    });
});

const injectArgs = function(rawTemplate, values) {
  let pattern = /%([0-9]+)%/;

  return rawTemplate.replace(pattern, function(a, match) {
      const value = values[match];

      let replacement = '';
      if(typeof value === 'object') {
          replacement = getRandomInt(value);
      }

      return replacement;
  });
};

const getRandomInt = function(param) {
    const min = param.min;
    const max = param.max;

    return Math.floor(Math.random() * (max - min)) + min;
};