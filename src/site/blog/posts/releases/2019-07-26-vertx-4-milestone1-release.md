---
title: Eclipse Vert.x 4 milestone 1 released!
date: 2019-07-26
template: post.html
author: vietj
draft: false
---

We are extremely pleased to announce the first 4.0 milestone release of Eclipse Vert.x .

Vert.x 4 is the evolution of the Vert.x 3.x series that will bring key features to Vert.x.

This release aims to provide a reliable distribution of the current development of Vert.x 4 for people that
want to try it and provide feedback.

#### Core futurisation

Vert.x 4 extends the 3.x callback asynchronous model to a future/callback hybrid model.

```java
public interface NetClient {

  // Since 3.0
  void connect(int port, String host, Handler<AsyncResult<NetSocket>> handler);

  // New in 4.0
  Future<NetSocket> connect(int port, String host);
}
```

In this first milestone, only the _Vert.x Core_ library contains the hybrid model. More Vert.x components
will be futurized soon and you will be able to try them in the next milestones.

#### Tracing

Instrumenting asynchronous application for distributed tracing is quite challenging because most tracing libraries
rely on [thread local storage](https://fr.wikipedia.org/wiki/Thread_Local_Storage). While it works reasonnably well
in a blocking application, this does not work for an asynchronous application.

This supposes that the application control flow matters (i.e threads) although what really matters is the application
request flow (e.g the incoming HTTP request).

We improved Vert.x 4 to reify the request flow, making it possible to integrate popular tracing tools such as [Zipkin](https://zipkin.io)
or [Opentracing](https://opentracing.io). Vert.x performance is legendary and we made sure that this does not have
any overhead out of the box (disabled).

We provide support for these two popular libraries under the _Vert.x Tracing_ umbrella.

#### Other changes

- Groovy has been simplified in Vert.x 4 to remove code generation that was not really needed in practice
- The original Redis client deprecated in 3.7 has been removed replaced by the new Redis client
- The following components have reached their end of life and have been pruned
  - MySQL / PostgreSQL async client replaced by the Vert.x SQL Client (since 3.8)
  - AMQP bridge replaced by the Vert.x AMQP Client (since 3.7)

#### Ramping up to Vert.x 4

Instead of developing all new features exclusively in Vert.x 4, we introduce some of these features in the 3.x branch
so the community can benefit from them. The Vert.x 4 development focus on more fundamental changes that cannot be done
in the 3.x series.

<img src="{{ site_url }}assets/blog/vertx-4-milestone1-release/vertx-4-timeline.png" alt="Screenshot" class="img-responsive">

This is the first milestone of Vert.x 4, we aim to release Vert.x 4 by the end of this year and you can of course
expect more milestones to outline the progress of the effort.

#### Finally

The [deprecations and breaking changes](https://github.com/vert-x3/wiki/wiki/4.0.0-Deprecations-and-breaking-changes)
 can be found on the wiki.

For this release there are no Docker images.,

The release artifacts have been deployed to [Maven Central](https://search.maven.org/search?q=g:io.vertx%20AND%20v:4.0.0-milestone1) and you can get the distribution on [Maven Central](https://repo1.maven.org/maven2/io/vertx/vertx-stack-manager/4.0.0-milestone1/).

Most importantly the documentation has been deployed on this preview web-site https://vertx-ci.github.io/vertx-4-preview/docs/

That's it! Happy coding and see you soon on our user or dev [channels](https://vertx.io/community).
