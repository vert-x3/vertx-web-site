---
title: Introducing new consumer API for vertx-rabbitmq-client
template: post.html
date: 2018-04-23
author: Sammers21
draft: true
---

In vertx-rabbitmq-client 3.6.0 release we are going to have the new consumer API. In this article I am going to explain what was wrong with the old one and show how convenient the new one is.

## What was wrong?

Before digging into the new API let's find out what was wrong with the old one.

Here is the two main points againts the old API:
1. Messages got obtainted from the event bus, without having ability to pause, resume consumption and chose backpressure strategy.
2. Arrived message was not typed. Basically it was a JsonObject.

## New API

Here is how simple queue consumption looks like with the new API:

```java
RabbitMQClient client = RabbitMQClient.create(vertx, new RabbitMQOptions());

client.basicConsumer("my.queue", res -> {
  if (res.succeeded()) {
    System.out.println("RabbitMQ consumer created !");
    RabbitMQConsumer mqConsumer = res.result();
    mqConsumer.handler((RabbitMQMessage message) -> {
          System.out.println("Got message: " + message.body().toString());
    });
  } else {
    res.cause().printStackTrace();
  }
});
```


In the code, you are proving a queue name to read messages from and the handler called with an instance of _RabbitMQConsumer_ when the asynchronous operation got succeed. So then you can provide a handler to call when a message arrives via _RabbitMQConsumer#handler_ call. A very simple and idiomatic.

You may also note that when we a message arrives, it has a type of _RabbitMQMessage_, this is a typed message representation. So you are aware of all the fields a message may have at the compile time.

Since _RabbitMQConsumer_ is a _ReadStream_, you also allowed to _pause_, _resume_ the stream, subscribe to the end event, get notified when an exception occurs. Additionally, you can cancel the subscription by calling _RabbitMQConsumer#cancel_ method.

## Backpressure

Sometimes you have more incoming messages than you can handle. The new consumer API is aware of such situation and lets you store arrived messages in the internal queue before they got handler by the application. Indeed, you can configure the queue size. So here is how you can limit the internal queue size to 300:

```java
QueueOptions options = new QueueOptions()
  .setMaxInternalQueueSize(300);

RabbitMQClient client = RabbitMQClient.create(vertx, new RabbitMQOptions());

client.basicConsumer("my.queue", options, res -> {
  if (res.succeeded()) {
    System.out.println("RabbitMQ consumer created !");
    RabbitMQConsumer mqConsumer = res.result();
    mqConsumer.handler((RabbitMQMessage message) -> {
      System.out.println("Got message: " + message.body().toString());
    });
  } else {
    res.cause().printStackTrace();
  }
});
```

One more interesting thing is what will happen the queue will be exceeded. In the example, the new message will be simply dropped. Another option is to drop the oldest message in the queue. In order to achieve this, you should specify the behavior by calling _QueueOptions#setKeepMostRecent_ method.

## Results

The new consumer API for vertx-rabbitmq-client is a more idiomatic and modern way to consume messages from a queue. The API is going to be recommended to use in the Vert.x 3.6.0 release, while the old will be deprecated.

Hope you enjoyed reading this article. See you soon.