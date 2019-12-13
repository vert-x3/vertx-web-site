---
title: Eclipse Vert.x 4 milestone 4 released!
date: 2019-12-13
template: post.html
author: vietj
draft: false
---

We are extremely pleased to announce the forth 4.0 milestone release of Eclipse Vert.x .

Vert.x 4 is the evolution of the Vert.x 3.x series that will bring key features to Vert.x.

This release aims to provide a reliable distribution of the current development of Vert.x 4 for people that
want to try it and provide feedback.

#### Futurisation

Vert.x 4 extends the 3.x callback asynchronous model to a future/callback hybrid model.

```java
public interface NetClient {

  // Since 3.0
  void connect(int port, String host, Handler<AsyncResult<NetSocket>> handler);

  // New in 4.0
  Future<NetSocket> connect(int port, String host);
}
```

This third milestone makes progress and fully covers with the following stack modules:

- Vert.x Shell
- Vert.x Mail Client
- Vert.x Consul Client
- Vert.x RabbitMQ Client
- Vert.x Stomp
- Vert.x Mongo Client

#### Mail client improvements

Our mail clients had nice contribution with the ability to use streaming payload for attachements and the
support for DKIM signatures.

#### General client improvements

Some Vert.x client are designed to be used within the verticle that created it while some can be shared between
verticles. This is a technical limitation that stems from the fact that client are implemented using Vert.x or Netty
(such as `HttpClient`) and are bound to the underlying event-loop that powers them.

In Vert.x 4 we decided to get away of this limitation to simplify the usage and the configuration of the clients. Of course
it is possible to continue confining clients within a verticle (for best performance) but clients can be now shared between
verticles when desired with a neglectible impact on performance (requiring message passing).

#### Security improvements

Finally here are a few improvements done in our security layer:

* Vertx Auth is now decoupled to handle authn/authz as 2 independent functions thanks to @sbastiandev
* Auth Shiro is deprecated in favour of the new "auth properties" module and "auth ldap"
* Web CSRF tokens are session aware to allow multiple requests from the same user
* Initial support for webauthn

#### Ramping up to Vert.x 4

Instead of developing all new features exclusively in Vert.x 4, we introduce some of these features in the 3.x branch
so the community can benefit from them. The Vert.x 4 development focus on more fundamental changes that cannot be done
in the 3.x series.

<img src="{{ site_url }}assets/blog/vertx-4-milestone4-release/vertx-4-timeline.png" alt="Screenshot" class="img-responsive">

This is the forth milestone of Vert.x 4, you can of course expect more milestones to outline the progress of the effort.

You can also read the previous milestone announces:

- https://vertx.io/blog/eclipse-vert-x-4-milestone-3-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-2-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-1-released

#### Finally

The [deprecations and breaking changes](https://github.com/vert-x3/wiki/wiki/4.0.0-Deprecations-and-breaking-changes)
 can be found on the wiki.

For this release there are no Docker images.,

The release artifacts have been deployed to [Maven Central](https://search.maven.org/search?q=g:io.vertx%20AND%20v:4.0.0-milestone4) and you can get the distribution on [Maven Central](https://repo1.maven.org/maven2/io/vertx/vertx-stack-manager/4.0.0-milestone4/).

You can bootstrap a Vert.x 4.0.0-milestone4 project using https://start.vertx.io.

The documentation has been deployed on this preview web-site https://vertx-ci.github.io/vertx-4-preview/docs/

That's it! Happy coding and see you soon on our user or dev [channels](https://vertx.io/community).
