const amqp = require('amqplib');
const ProgressBar = require('progress');

/**
 * Expose RabbitMQMessageProducer
 */
exports = module.exports = RabbitMQMessageProducer;

/**
 * @param rabbitMQConfig
 * @param messageConfig
 * @constructor
 */
function RabbitMQMessageProducer(rabbitMQConfig, messageConfig) {
    this.rabbitmq = rabbitMQConfig;
    this.message = messageConfig;
}

/**
 * @returns {Promise<void>}
 */
RabbitMQMessageProducer.prototype.connect = async function() {

    const url = buildUrl(this.rabbitmq);
    this.connection = await amqp.connect(url);
    console.log('Connected to RabbitMQ server');
    this.channel = await this.connection.createChannel();
    console.log('Listening on channel');
};

RabbitMQMessageProducer.prototype.disconnect = async function() {
    return this.connection.close();
};

/**
 * @returns {Promise<void>}
 */
RabbitMQMessageProducer.prototype.send = async function() {

    const exchangeName = this.rabbitmq.exchangeName;
    const exchangeType = this.rabbitmq.exchangeType;
    const exchangeOptions = this.rabbitmq.options;
    const routingKey = this.rabbitmq.routingKey;
    const messageTemplates = this.message.templates;
    const bar = buildProgressBar(this.message.number);
    const self = this;

    this.channel.assertExchange(exchangeName, exchangeType, exchangeOptions);

    let templateIndex = 0;

    return new Promise((resolve) => {
        const repeat = setInterval(function() {

            const msg = injectArgs(messageTemplates[templateIndex].pattern, messageTemplates[templateIndex].values);
            self.channel.publish(exchangeName, routingKey, new Buffer(msg));
            bar.tick();

            if (bar.complete) {
                clearInterval(repeat);
                // Leave some time to send the last message
                setTimeout(() => {
                    resolve();
                }, 500);
            }

            templateIndex = (templateIndex + 1) % messageTemplates.length;
        }, this.message.delay);
    });
};

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
    let pattern = /%([0-9a-zA-Z]+)%/g;

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
