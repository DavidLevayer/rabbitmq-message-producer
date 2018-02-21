#!/usr/bin/env node

const amqp = require('amqplib/callback_api');
const ProgressBar = require('progress');

const buildUrl = (rabbitMqConfig) => {
    return `${rabbitMqConfig.protocol}://${rabbitMqConfig.user}:${rabbitMqConfig.password}@${rabbitMqConfig.hostname}`;
};

const buildProgressBar = (total) => {
    return new ProgressBar('  Sending [:bar] :rate message/s :percent', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: total
    });
};

const injectArgs = (rawTemplate, values) => {
    let pattern = /%([0-9]+)%/g;

    return rawTemplate.replace(pattern, function(a, match) {
        const value = values[match];

        let replacement = '';
        if (typeof value === 'object') {
            replacement = getRandomInt(value);
        }

        return replacement;
    });
};

const getRandomInt = (param) => {
    const min = param.min;
    const max = param.max;

    return Math.floor(Math.random() * (max - min)) + min;
};

const RabbitMQMessageProducer = (rabbitMQConfig, messageConfig) => {

    amqp.connect(buildUrl(rabbitMQConfig), function(err, conn) {
        conn.createChannel(function(err, ch) {

            const exchangeName = rabbitMQConfig.exchangeName;
            const routingKey = rabbitMQConfig.routingKey;
            const messageTemplates = messageConfig.templates;

            ch.assertExchange(exchangeName, rabbitMQConfig.exchangeType, rabbitMQConfig.options);
            const bar = buildProgressBar(messageConfig.number);

            let templateIndex = 0;

            const repeat = setInterval(function() {

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
            }, messageConfig.delay);
        });
    });
};

module.exports = RabbitMQMessageProducer;
