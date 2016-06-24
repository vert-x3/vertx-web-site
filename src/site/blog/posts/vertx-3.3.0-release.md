---
title: Vert.x 3.3.0 is released !
date: 2016-06-24
template: post.html
author: cescoffier
---

That was a long run …. but here we are. We are very pleased to announce the release of Vert.x 3.3.0!

This release is huge with lots of new features, improvements, and obviously bug fixes. We won’t detail all the new features here (some are highlighted below), and full release notes are available: https://github.com/vert-x3/wiki/wiki/3.3.0---Release-Notes

Breaking changes are there: https://github.com/vert-x3/wiki/wiki/3.3.0---Breaking-Changes. Be sure to read them before migrating.

The event bus client using the SockJS bridge are available from NPM, Bower and as a WebJar:

* https://www.npmjs.com/package/vertx3-eventbus-client
* https://github.com/vert-x3/vertx-bus-bower
* http://www.webjars.org/

Docker images are also available on the [Docker Hub](https://hub.docker.com/u/vertx/). The Vert.x distribution is also available from [SDKMan](http://sdkman.io/index.html) and [HomeBrew](http://brew.sh/).

Let’s highlight some of the major features shipped with this release.

* Vertx 3.3.0 is the first version to support **HTTP2** (client and server). You can now configure HTTP servers and clients to use HTTP2. Proxy support for TCP and HTTP client has also been added.
* This version shows also the introduction of a bridge with **Apache Camel**. So, integrating Vert.x applications with legacy systems (using EIP) has never been so easy.
* Several new components have been developed to implement microservice-based applications. First, a pluggable **service discovery** is now available. An implementation of the **circuit breaker** pattern has also been provided.
* **AMQP 1.0** support has been also integrated thanks to a bridge to send and receive messages from AMQP. A client has also been shipped to interact directly with an AMQP broker or router.
* New metrics has also been introduced to ease the monitoring of running applications. For instance, it’s now possible to monitor the thread usage in the **worker thread pool** and in the **JDBC connection pools**.
* With this version, you can configure the TCP aspects of the event bus for, for instance, use SSL. Also notice a bridge between the  event bus of Vert.x 2 and  the one from Vert.x 3.
* Most of the delivered components are now deployable in **OSGi** environments. So you can easily integrate Vert.x in Apache Karaf, Service Mix, or Apache Sling.
* Vert.x Unit usability has been greatly improved. It is now possible to write test using Hamcrest, AssertJ, Rest Assured, or any assertion libraries you want.

Many thanks to all the committers and community whose contributions made this possible, especially to Alex Lehman, Paul Bakker, Robbie Gemmel, Claus Ibsen, Michael Kremer, and many many other!

The artifacts have been deployed to [Maven Central](http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22io.vertx%22%20AND%20v%3A%223.3.0%22) and you can get the distribution on [Bintray](https://bintray.com/vertx/downloads/distribution/3.3.0/view).

Just a word about the future. As we did last, year, a poll will be organized in the next few weeks to collect ideas and prioritize the Vert.x 3.4 and beyond roadmap. Stay tuned, we love hearing about your ideas and issues.

Happy coding !
