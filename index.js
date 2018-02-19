#!/usr/bin/env node

const amqp = require('amqplib/callback_api');
const ProgressBar = require('progress');
const config = require('./config');

const serverUrl = `${config.rabbitmq.protocol}://${config.rabbitmq.user}:${config.rabbitmq.password}@${config.rabbitmq.hostname}`;

amqp.connect(serverUrl, function (err, conn) {
    conn.createChannel(function (err, ch) {

        const exchangeName = config.rabbitmq.exchangeName;
        const routingKey = config.rabbitmq.routingKey;
        const messageTemplates = config.message.templates;

        ch.assertExchange(exchangeName, config.rabbitmq.exchangeType, config.rabbitmq.options);

        let bar = new ProgressBar('  Sending [:bar] :rate message/s :percent', {
            complete: '=',
            incomplete: ' ',
            width: 20,
            total: config.message.number
        });
        let templateIndex = 0;

        const repeat = setInterval(function () {

            const msg = injectArgs(messageTemplates[templateIndex].pattern, messageTemplates[templateIndex].values);
            ch.publish(exchangeName, routingKey, new Buffer(msg));
            bar.tick();

            if (bar.complete) {
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
    let pattern = /%([0-9]+)%/g;

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