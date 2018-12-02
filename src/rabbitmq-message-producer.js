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

const injectArgs = (rawTemplate, args) => {
    const regex = /%[0-9a-zA-Z]+%/g;
    const result = {};

    for (let key in rawTemplate) {
        const rawValue = rawTemplate[key];

        if (typeof rawValue !== 'string') {
            // Do not process number and boolean
            result[key] = rawValue;
            continue;
        }

        const matches = rawValue.match(regex);

        if (matches === null || matches.length === 0) {
            // Do not process strings that shouldn't be modified
            result[key] = rawValue;
            continue;
        }

        matches.forEach(match => {
            // Remove '%' symbols
            const argKey = match.substr(1, match.length - 2);
            const arg = args[argKey];
            const fillMethod = arg.fill;
            let replacement;

            switch (fillMethod) {
                case 'range':
                    replacement = getNumberBetween(arg.min, arg.max);
                    break;
                case 'random':
                    replacement = getRandomValue(arg.values);
                    break;
                case 'auto':
                    replacement = getAutoIncrement();
                    break;
                default:
                    replacement = '';
            }

            if (rawValue.length === match.length) {
                // Keeps replacement type if match is not part of some string
                result[key] = replacement;
            } else {
                result[key] = rawValue.replace(regex, replacement);
            }
        });

    }

    return JSON.stringify(result);
};

const getNumberBetween = (min, max) => {
    return Math.floor(Math.random() * (max - min)) + min;
};

const getRandomValue = (values) => {
    return values[Math.floor(Math.random() * values.length)];
};

let initialNumber = 0;
const getAutoIncrement = () => {
    return initialNumber++;
};
