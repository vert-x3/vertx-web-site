---
title: Eclipse Vert.x RabbitMQ client gets a new consumer API!
template: post.html
date: 2018-04-23
author: Sammers21
draft: false
---

In Eclipse Vert.x 3.6.0 the RabbitMQ client will get a new consumer API. In this post we are going to show
the improvements since the previous API and how easy it is to use now.

Before digging into the new API let's find out what were the limitations of the actual one:

1. The API uses the event bus in such limiting the control of the consumer over the RabbitMQ queue.
2. The message API is based on `JsonObject` which does not provide a typed API

## The new API at a glance

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
    // Oups something went wrong
    res.cause().printStackTrace();
  }
});
```


Now to create a queue you simply call the `basicConsumer` method and you obtain asynchronously
a `RabbitMQConsumer`.

Then you need to provide a handler called for each message consumed via _RabbitMQConsumer#handler_ which
is the idiomatic way to consumer stream in Vert.x

You may also note that when we a message arrives, it has the type of `RabbitMQMessage`, this is a typed
message representation.

Since `RabbitMQConsumer` is a stream, you also allowed to `pause` and `resume` the stream, subscribe to the
end event, get notified when an exception occurs.

In addition, you can cancel the subscription by calling `RabbitMQConsumer#cancel` method.

## Backpressure

Sometimes you can have more incoming messages than you can handle.

The new consumer API allows you to control this and lets you store arrived messages in the internal queue
before they are delivered to the application. Indeed, you can configure the queue size.

Here is how you can limit the internal queue size:

```java

// Limit to max 300 messages
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

When the intenral queue queue capacity is exceeded, the new message will be simply dropped.

An alternative option is to drop the oldest message in the queue.

In order to achieve this, you should specify the behavior by calling `QueueOptions#setKeepMostRecent` method.

## Finally

The new Vert.x RabbitMQ client consumer API is way more idiomatic and modern way to consume messages from a queue.

This API is going to provided in the 3.6.0 release, while the old will be deprecated.

I hope you enjoyed reading this article. See you soon on our [Gitter channel](https://gitter.im/eclipse-vertx/vertx-users)!
