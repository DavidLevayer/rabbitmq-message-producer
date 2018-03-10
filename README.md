# rabbitmq-message-producer 
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/DavidLevayer/rabbitmq-message-producer/graphs/commit-activity) [![GitHub license](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/DavidLevayer/rabbitmq-message-producer/blob/master/LICENSE)



> **rabbitmq-message-producer** is a small NodeJS application which help generating RabbitMQ messages to test or debug your application. You can design your template and generate diversified yet coherent messages.

## RabbitMQ server

First scenario: you already have a RabbitMQ server: just skip this step and go ahead to the configuration section.

Second scenario: you don't have a RabbitMQ server: you can easily instantiate one using Docker technology:

```bash
# Download, create and run your RabbitMQ server in a docker container
docker run -d --hostname my-rabbit --name some-rabbit -p 4369:4369 -p 5671:5671 -p 5672:5672 -p 15672:15672 rabbitmq
# Enable RabbitMQ management
docker exec some-rabbit rabbitmq-plugins enable rabbitmq_management
# Stop it once you're done (all messages will be lost!)
docker stop some-rabbit
# Start it again
docker restart some-rabbit
```
Then you can access RabbitMQ web interface at [http://localhost:15672/](http://localhost:15672/)

Note: Docker must already be installed on your computer. Please refer to [Docker documentation](https://docs.docker.com/install/).

## Configuration

The easiest way to get started is to copy `config.json.dist` file into `config.json`, and then edit it.

Available options:

**rabbitmq**: parameters that should be used to reach your RabbitMQ server.
```json

"rabbitmq": {
  "protocol": "amqp",
  "hostname": "localhost",
  "user": "guest",
  "password": "guest",
  "exchangeName": "my.exchange",
  "exchangeType": "direct",
  "routingKey": "world",
  "options": {
    "durable": true
  }
}  
```

Note: `options` can contain any valid option mentioned [here](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertExchange).

**message**: parameters that configure your sending options:

* **number**: the total number of messages to send.
* **delay**: time to wait between two messages, in milliseconds.
* **templates**: message templates to use.
```json

"message": {
  "number": 50,
  "delay": 0,
  "templates": []
}
```

## Message templates

Each `template` object must have following parameters:

* **pattern**: a string representing JSON object. Values between `%` characters will be replaced following associated rules.
* **values**: a JSON object that contains rules to use to replace values between `%` characters.

A short example is often better than a long speech:

Template example:
```json
"templates": [
  {
    "pattern": "{\"productId\": %id%, \"productCategory\": \"%category%\", \"productPrice\": %price%}",
    "values": {
      "id": {
        "type": "auto"
      },
      "category": {
        "type": "random",
        "values": [
          "fruit",
          "vegetable",
          "meat"
        ]
      },
      "price": {
        "type": "range",
        "min": 10,
        "max": 50
      }
    }
  }
]
```

Example of generated messages:
```json
{"productId": 0, "productCategory": "fruit", "productPrice": 23}
{"productId": 1, "productCategory": "meat", "productPrice": 31}
{"productId": 2, "productCategory": "meat", "productPrice": 23}
{"productId": 3, "productCategory": "vegetable", "productPrice": 12}
```

## Contributions

Feel free to contribute to this project in any way: pull request, issue, etc.

## License

MIT
