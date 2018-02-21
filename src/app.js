#!/usr/bin/env node

const config = require('../config');
const RabbitMQMessageProducer = require('./rabbitmq-message-producer');
const producer = new RabbitMQMessageProducer(config.rabbitmq, config.message);

const start = async function() {
    await producer.connect();
    await producer.send();
    await producer.disconnect();
};

start();
