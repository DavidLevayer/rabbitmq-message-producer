#!/usr/bin/env node

const config = require('./config');
const rabbitMQMessageProducer = require('./src/rabbitmq-message-producer');

rabbitMQMessageProducer(config.rabbitmq, config.message);
