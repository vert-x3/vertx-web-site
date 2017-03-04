---
title: Vert.x 3.1.0 is released !
date: 2015-10-08
template: post.html
author: purplefox
---

I'm pleased to announce the release of Vert.x 3.1!

Some of the highlights of this release include:

* [Vertx-sync](http://vertx.io/docs/vertx-sync/java/) is a set of utilities that allow you to perform asynchronous
operations and receive events in a synchronous way, but without blocking kernel threads.

* [Vertx-stomp](http://vertx.io/docs/vertx-stomp/java/) is an implementation of a STOMP server and client.
You can use the STOMP server with other clients and use the STOMP client with other servers.
The server and the client supports the version 1.0, 1.1 and 1.2 of the STOMP protocol.
The STOMP server can also be used as a bridge with the
vert.x event bus.

* [Vertx-shell](http://vertx.io/docs/vertx-shell/java/) is a command line interface for the Vert.x runtime available from
regular terminals using different protocols.

* Re-implementation of the Starter class and related functionality. And now redeploy is back!

Full release notes can be found here:

https://github.com/vert-x3/wiki/wiki/3.1-Release-Notes

Breaking changes here:

https://github.com/vert-x3/wiki/wiki/3.1.0---Breaking-changes

NPM for the event-bus client here:

https://www.npmjs.com/package/vertx3-eventbus-client

Many thanks to all the committers and community whose contributions made this possible.

A special thanks to the full-time team - Clement, Julien and Paulo who put in a lot of work to get this out :)

Next stop is Vert.x 3.2 which we hope to have out before Christmas.

The artifacts have been deployed to [Maven Central](http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22io.vertx%22%20AND%20v%3A%223.1.0%22)
 and you can get the distribution on [Bintray](https://bintray.com/vertx/downloads/distribution/3.1.0/view).
