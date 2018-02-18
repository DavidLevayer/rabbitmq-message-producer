#!/usr/bin/env node

const amqp = require('amqplib/callback_api');
const config = require('./config');

const serverUrl = `${config.rabbitmq.protocol}://${config.rabbitmq.hostname}`;

amqp.connect(serverUrl, function (err, conn) {
    conn.createChannel(function (err, ch) {

        const exchangeName = config.rabbitmq.exchangeName;
        const routingKey = config.rabbitmq.routingKey;
        const messageTemplates = config.message.templates;

        ch.assertExchange(exchangeName, 'direct', config.rabbitmq.options);

        let counter = 0;
        let templateIndex = 0;
        const repeat = setInterval(function () {

            const msg = injectArgs(messageTemplates[templateIndex].pattern, messageTemplates[templateIndex].values);
            ch.publish(exchangeName, routingKey, new Buffer(msg));
            console.log("%d - [x] Sent %s", counter, msg);

            if (++counter >= config.message.number) {
                clearInterval(repeat);
                // Leave some time to send the last message
                setTimeout(() => {
                    conn.close();
                    process.exit(0);
                }, 500);
            }

            templateIndex = (templateIndex + 1) % messageTemplates.length;
        }, config.message.delay);
    });
});

const injectArgs = function (rawTemplate, values) {
    let pattern = /%([0-9]+)%/;

    return rawTemplate.replace(pattern, function (a, match) {
        const value = values[match];

        let replacement = '';
        if (typeof value === 'object') {
            replacement = getRandomInt(value);
        }

        return replacement;
    });
};

const getRandomInt = function (param) {
    const min = param.min;
    const max = param.max;

    return Math.floor(Math.random() * (max - min)) + min;
};