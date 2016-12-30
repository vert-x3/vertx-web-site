---
title: Internet of Things - Reactive and Asynchronous with Vert.x
template: post.html
date: 2016-12-29
author: ppatierno
---

![Vert.x IoT](/assets/blog/vertx-iot/vertx-iot.png)

[NOTE this is a re-publication of the following [blog post](https://paolopatierno.wordpress.com/2016/12/27/internet-of-things-reactive-and-asynchronous-with-vert-x/).]

I have to admit … before joining Red Hat I didn’t know about the [*Eclipse Vert.x*](http://vertx.io/) project but it took me few days to fall in love with it !

For the other developers who don’t know what Vert.x is, the best definition is …

> … a toolkit to build distributed and reactive systems on top of the JVM using an asynchronous non blocking development model

The first big thing is related to develop a *reactive* system using Vert.x which means :

* *Responsive* : the system responds in an acceptable time;
* *Elastic* : the system can scale up and scale down;
* *Resilient* : the system is designed to handle failures gracefully;
* *Asynchronous* : the interaction with the system is achieved using asynchronous messages;

The other big thing is related to use an *asynchronous non blocking* development model which doesn’t mean to be multi-threading but thanks to the non blocking I/O (i.e. for handling network, file system, …) and callbacks system, it’s possible to handle a huge numbers of events per second using a single thread (aka “event loop”).

You can find a lot of [material](http://vertx.io/materials/) on the official web site in order to better understand what Vert.x is and all its main features; it’s not my objective to explain it in this very short article that is mostly … you guess … messaging and IoT oriented  :-)

In my opinion, all the above features make Vert.x a great toolkit for building Internet of Things applications where being reactive and asynchronous is a “must” in order to handle millions of connections from devices and all the messages ingested from them.

## Vert.x and the Internet of Things

As a toolkit, so made of different components, what are the ones provided by Vert.x and useful to IoT ?

Starting from the Vert.x [Core](https://github.com/eclipse/vert.x) component, there is support for both versions of HTTP protocol so 1.1 and 2.0 in order to develop an [HTTP server](http://vertx.io/docs/vertx-core/java/#_writing_http_servers_and_clients) which can expose a RESTful API to the devices. Today , a lot of web and mobile developers prefer to use this protocol for building their IoT solution leveraging on the deep knowledge they have about the HTTP protocol.

Regarding more IoT oriented protocols, there is the Vert.x [MQTT server](https://github.com/vert-x3/vertx-mqtt-server) component which doesn’t provide a full broker but exposes an API that a developer can use in order to handle incoming connections and messages from remote MQTT clients and then building the business logic on top of it, so for example developing a real broker or executing protocol translation (i.e. to/from plain TCP,to/from the Vert.x Event Bus,to/from HTTP,to/from AMQP and so on). The API raises all events related to the connection request from a remote MQTT client and all subsequent incoming messages; at same time, the API provides the way to reply to the remote endpoint. The developer doesn’t need to know how MQTT works on the wire in terms of encoding/decoding messages.

Related to the AMQP 1.0 protocol there are the Vert.x [Proton](https://github.com/vert-x3/vertx-proton) and the [AMQP bridge](https://github.com/vert-x3/vertx-amqp-bridge) components. The first one provides a thin wrapper around the [Apache Qpid](http://qpid.apache.org/) Proton engine and can be used for interacting with AMQP based messaging systems as clients (sender and receiver) but even developing a server. The last one provides a bridge between the protocol and the Vert.x Event Bus mostly used for communication between deployed Vert.x verticles. Thanks to this bridge, verticles can interact with AMQP components in a simple way.

Last but not least, the Vert.x [Kafka client](https://github.com/vert-x3/vertx-kafka-client) component which provides access to Apache Kafka for sending and consuming messages from topics and related partitions. A lot of IoT scenarios leverage on Apache Kafka in order to have an ingestion system capable of handling million messages per second.

## Conclusion

The current Vert.x code base provides quite interesting components for developing IoT solutions which are already available in the current 3.3.3 version (see Vert.x Proton and AMQP bridge) and that will be available soon in the future 3.4.0 version (see MQTT server and Kafka client). Of course, you don’t need to wait for their official release because, even if under development, you can already adopt these components and provide your feedback to the community.

This ecosystem will grow in the future and Vert.x will be a leading actor in the IoT applications world based on a microservices architecture !
