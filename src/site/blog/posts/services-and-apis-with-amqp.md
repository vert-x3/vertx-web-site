---
title: Building services and APIs with AMQP 1.0
template: post.html
date: 2017-01-25
author: scholzj
draft: false
---

Microservices and APIs are everywhere. Everyone talks about them, presentation slides are full of them ... some people are actually even building them. Microservices and APIs are of course not completely new concepts and they are a bit over-hyped. But in general the ideas behind them are not bad. Unfortunately, many people seem to believe that the only way how to implement an API in microservice is to use HTTP and REST. That is of course not true. Microservices and APIs can be based on many different protocols and technologies. My favorite one is of course [AMQP](http://www.amqp.org). Don't take me wrong, HTTP and REST is not necessarily bad. But in some cases AMQP is simply better and creating AMQP based APIs does not need to be complicated.

[NOTE this is a re-publication of the following [blog post](http://blog.effectivemessaging.com/2017/01/building-services-and-apis-with-amqp-10.html)]

## LiveScore service

For demonstration, I will use a very simple service for keeping scores of football games. It has very basic API. It has only three calls:
* Add a new game
* Update a score of existing game
* List the scores
The AMQP variants will be additionally able to push live updates to the clients.

The demo is using Java and Vert.x toolkit. [Vert.x](http://vertx.io/) is cool and I definitely recommend it to everyone. But most of the stuff from the demo should be possible also in any other programming languages and/or framework.

## HTTP API

HTTP implementation of my service is a typical REST API. Since it is very simple, it accepts requests only on one endpoint – /api/v1.0/scores. New games are added as POST operations, scores are updated with PUT operations and list of all scores can be obtained with GET.

With Vert.x, creating HTTP/REST API is very easy. First the web router has to be created with all planned API calls:
```java
router = Router.router(vertx);  
router.route("/api/v1.0/*").handler(BodyHandler.create());  
router.get("/api/v1.0/scores").handler(this::getScores);  
router.post("/api/v1.0/scores").handler(this::addGame);  
router.put("/api/v1.0/scores").handler(this::setScore);  
```

Then the HTTP server has to be created and linked with the router:
```java
HttpServerOptions httpOptions = new HttpServerOptions();  
server = vertx.createHttpServer(httpOptions)  
   .requestHandler(router::accept)  
   .listen(httpPort);  
```
 
And finally the handlers which will be triggered for each API call have to be implemented as well. The full code is on [GitHub](https://github.com/scholzj/livescore-demo-vertx-http).

![HTTP based API](/assets/blog/services-and-apis-with-amqp/HTTP-API.png)

The HTTP API doesn’t provide any way how to automatically push the score updates to the clients. The clients simply have to poll the service periodically to get the updates. HTTP has of course some ways how to push live updates to clients. For example, with WebSockets or with chunked transfers. However, these are not that easy to implement. The service would also need to keep separate connection with every client and push the updates for each of them separately.

## AMQP API

Creating the HTTP API was really easy. Creating an AMQP API has to be more complicated, right? We would need an AMQP server, which will listen on some port, accept the connections, sessions, links and so on. There are usually no nice and simple to use libraries for this.

Sure, this is one way how to do it. There is actually a nice library called [Apache Qpid Proton](http://qpid.apache.org/proton/index.html). It has Java and C versions and bindings into many other languages (Go, C++, Python, …). It makes creating your own AMQP server lot easier. It will take care of decoding and encoding the AMQP protocol, handling the connections, sessions etc. But still, Qpid Proton is not even nearly as easy to use as the HTTP router used for the HTTP API.

![API with AMQP server](/assets/blog/services-and-apis-with-amqp/AMQP-Server-API.png)

Are there any easier options? What if all what is needed to create AMQP based API is a simple AMQP client? Normally, that should not be a possible because we need the API to listen on some port for the clients to connect to it and send requests. And clients usually don’t listen on any ports. However, Apache Qpid has something called [Dispatch](http://qpid.apache.org/components/dispatch-router/index.html). It works as a lightweight AMQP router. Dispatch will serve as the AMQP server which was missing. It will take care of handling client connections, security and shield the service from the actual clients. All the service needs to do is to use AMQP client to connect to Dispatch on predefined address and wait for the request.

![AMQP API with Dispatch router](/assets/blog/services-and-apis-with-amqp/AMQP-API.png)

Dispatch needs to be configured with three API entry points as addresses:
```
address {  
    prefix: /setScore  
    distribution: balanced  
}  
address {  
    prefix: /getScore  
    distribution: balanced  
}  
address {  
    prefix: /addGame  
    distribution: balanced  
}  
```

LiveScore service will connect to these addresses as a receiver / consumer. Clients will connect to them as senders  /producers. And Dispatch will take care of routing the messages between the clients and the service. Clients can also create additional receivers so that the service is able to respond to their requests and specify the address of the receiver as the reply-to header in the request message. LiveScore service will automatically send the response to this address. But specifying a reply-to is not mandatory. If the client wants, it can simply fire the request and forget about the response.

LiveScore service is using Vert.x AMQP Bridge which allows easy integration between the Vert.x Event Bus and the AMQP connection to my router. The service starts the AMQP Bridge and if it successfully connects to Dispatch it creates three receivers for the API calls.

```java
AmqpBridgeOptions options = new AmqpBridgeOptions().addEnabledSaslMechanism("ANONYMOUS");  
bridge = AmqpBridge.create(vertx, options);  
bridge.start(amqpHostname, amqpPort, res -> {  
   if (res.succeeded())  
   {  
     bridge.createConsumer("/setScore").setMaxBufferedMessages(100).handler(this::setScore);  
     bridge.createConsumer("/getScores").setMaxBufferedMessages(100).handler(this::getScores);  
     bridge.createConsumer("/addGame").setMaxBufferedMessages(100).handler(this::addGame);  
     fut.complete();  
   }  
   else  
   {  
     fut.fail(res.cause());  
   }  
});  
```

The only other thing which needs to be done is creating handlers for handling the requests received from clients:

```java
public void getScores(Message<Object> msg)  
{  
   if(msg.replyAddress() != null)  
   {  
     JsonObject response = new JsonObject();  
     response.put("application_properties", new JsonObject().put("status", 200));  
     response.put("body", new JsonArray(Json.encode(scoreService.getScores())).encode());  
     msg.reply(response);  
   }  
   else  
   {  
     LOG.warn("Received LiveScore/getScores request without reply to address");  
   }  
}  
```

Live broadcasting of score updates is also very easy. New address has to be added into Dispatch configuration. This address will be used in opposite direction. the service connects to it as sender / producer and clients which want to receive the live updates create a receiver against this address. What is important, this address has to be marked as multicast. Thanks to that every single message will be delivered to all connected clients and not just to one of them:
```
address {  
    prefix: /liveScores  
    distribution: multicast  
}  
```

![Multicasting messages](/assets/blog/services-and-apis-with-amqp/AMQP-API-multicast.png)

Thanks to the multicast distribution, the service doesn’t need to send a separate update to every single client. It sends the message only once and dispatch takes care of the rest.

```java
public void broadcastUpdates(Game game)  
{  
   LOG.info("Broadcasting game update " + game);  
   JsonObject message = new JsonObject();  
   message.put("body", new JsonObject(Json.encode(game)).encode());  
   producer.send(message);  
} 
```

Again, the complete source codes of the demo service are available on [GitHub](https://github.com/scholzj/livescore-demo-vertx-amqp-bridge).

## How to structure AMQP APIs?

Compared to HTTP and REST, AMQP gives its users a lot more freedom when designing the API. It isn’t tied up by the available HTTP methods.

My LiveScore service is using the API endpoints named according to their function:
* /LiveScore/addGame
* /LiveScore/setScore
* /LiveScore/getScores
It also uses HTTP status codes in application properties of the different messages to describe the result of the request and JSON as the message payload with the actual request and response.

Is that the best way? To be honest, I don’t know. Just for the request encoding there are many different options. AMQP has its own encodings which supports all possible basic as well as more advanced data types and structures. But AMQP can also transfer any opaque data - be it JSON, XML, Google Protocol Buffers or anything else. For simple request, the payload can be completely skipped and application properties can be used instead. And for everyone who really loves HTTP/REST, one can also model the API in REST style as I did in an [alternative implementation](https://github.com/scholzj/livescore-demo-vertx-amqp-bridge-rest-style) of my demo service.

## Browser

One of the environments where HTTP is so to say “at home” is browser. AMQP will probably never be as “native” protocol for any browser as HTTP is. However AMQP can be used even from browsers. It has WebSocket binding and there are Javascript AMQP libraries - for example rhea. So AMQP can be also used really everywhere.

## Decoupling

It is important to mention that the Dispatch router doesn’t decouple the client from the service. If decoupling is what is needed, it can be easily achieved by replacing the Dispatch router with some AMQP broker. The broker would decouple the client from the service without any changes in the service or clients.

## Conclusion

While creating APIs using AMQP can be very easy, it doesn’t mean that AMQP is the best protocol for all APIs. There are definitely APIs where HTTP is more suitable. But in some use cases, AMQP has clear advantages. In my LiveScore example it is especially one to many communication. It is important to keep the mind open and select the best available for given service.
