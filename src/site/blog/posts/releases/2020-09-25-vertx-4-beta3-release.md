---
title: Eclipse Vert.x 4 beta 3 released!
date: 2020-09-25
template: post.html
author: vietj
draft: false
---

We are extremely pleased to announce the third 4.0 beta release of Eclipse Vert.x .

Vert.x 4 is the evolution of the Vert.x 3.x series that will bring key features to Vert.x.

#### HTTP client request creation

Until Beta3, HTTP client has created lazy HTTP requests, since then creating a request
has become an asynchronous operation guaranteeing that a slot for performing the request
is granted:

```java
// Created a request
HttpClientRequest request = client.get("/some-uri");

// Connect to the server or reuse a connection from the pool and then try to send the request
request.end();

// Since Beta3
client.get("/some-uri", ar -> {
  // The client connected to the server or reused a connection from the pool
  if (ar.succeeded()) {
    HttpClientRequest request = ar.result();

    // Send the request
    request.end();
  }
});
```

Another (hidden) motivation to switch to this model is avoiding data races when the
HTTP client is used outside the event-loop using futures.

Previously you could write code like:

```java
Future<HttpClientResponse> get = client.get("some-uri");

// Assuming we have a client that returns a future response
// assuging this is *not* on the event-loop
Future<Buffer> fut = get.send().compose(response -> {

  // Response events might have happen already
  return response.body();
});
```

Now you can write instead:

```java
Future<Buffer> fut = client.get("some-uri").compose(request -> {
  request.send().compose(response -> response.body())
});
```

#### HttpServerResponse send method

In the previous beta, HTTP client request got a new simplified `send` method to send
a body or a stream. We did the same for the HTTP server response API:

```java
server.requestHandler(req -> {
  req.pause();
  getSomeStream().onSuccess(stream -> {
    req.response().send(stream);
  });
});
```

#### HTTP tunnel improvements

Creating an HTTP tunnel has now become more natural:

```java
client.request(HttpMethod.CONNECT, "some-uri")
  .onSuccess(request -> {

    // Connect to the server
    request.connect(ar -> {
      if (ar.succeeded()) {
        HttpClientResponse response = ar.result();

        if (response.statusCode() != 200) {
          // Connect failed for some reason
        } else {
          // Tunnel created, raw buffers are transmitted on the wire
          NetSocket socket = response.netSocket();
        }
      }
    });
});
```

The new `connect` method tells the client that when a `201` response is received
from the server then the connection should be switched to not interpret HTTP
data anymore.

On the server, the API has become asynchronous and renamed to `toNetSocket()`:

```java
server.requestHandler(request -> {
  if (request.method() == HttpMethod.CONNECT) {
    // Will send an HTTP 201 status code and switch the connection to use raw buffers
    request.toNetSocket(ar -> {
      if (ar.succeeded()) {
        NetSocket socket = ar.result();
      }
    });
  }
});
```

#### WebSocket upgrade improvements

The server WebSocket manual upgrade operation has also become asynchronous and renamed
to `toWebSocket()`

```java
server.requestHandler(request -> {
  if (request.method() == HttpMethod.GET && "Upgrade".equals(request.getHeader("connection"))) {
    // Will do the WebSocket handshake
    request.toWebSocket(ar -> {
      if (ar.succeeded()) {
        ServerWebSocket socket = ar.result();
      }
    });
  }
});
```

#### Row to JSON conversion

SQL client can now easily transform a `Row` into a JSON object, this can be convienient
for applications directly transferring JSON results to the client:

```java
client
  .preparedQuery("SELECT * FROM USERS WHERE ID=$1")
  .execute(Tuple.of(id))
  .onSuccess(row -> {
    if (row.size() == 1) {
      JsonObject json = row.iterator().next().toJson();
    }
  });
```

#### OAuth2/OIDC PKCE

`OAuth2Handler` can now handle [PKCE](https://tools.ietf.org/html/rfc7636), which means another layer of security to your application.

#### Redis RESP3

The redis client can now speak `RESP3` with redis servers. This means it can handle all the new types and APIs available on redis from all versions (RESP2, redis < 6) and (RESP3, redis >= 6).

#### Finally

This is the Beta3 relase of Vert.x 4, you can of course expect another beta as we get feedback from the community and fix issues that we failed to catch before.

You can also read the milestone announces to know more about the overral changes:

- https://vertx.io/blog/eclipse-vert-x-4-beta-1-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-5-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-5-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-4-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-3-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-2-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-1-released

The [deprecations and breaking changes](https://github.com/vert-x3/wiki/wiki/4.0.0-Deprecations-and-breaking-changes)
 can be found on the wiki.

For this release there are no Docker images.

The release artifacts have been deployed to [Maven Central](https://search.maven.org/search?q=g:io.vertx%20AND%20v:4.0.0.Beta1) and you can get the distribution on [Maven Central](https://repo1.maven.org/maven2/io/vertx/vertx-stack-manager/4.0.0.Beta1/).

You can bootstrap a Vert.x 4.0.0.Beta3 project using https://start.vertx.io.

The documentation has been deployed on this preview web-site https://vertx-web-site.github.io/docs/

That's it! Happy coding and see you soon on our user or dev [channels](https://vertx.io/community).
