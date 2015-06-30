---
title: Vert.x 2.1.6 released !
date: 2015-06-30
template: post.html
author: cescoffier
---

The Vert.x team is pleased to announce the release of Vert.x **2.1.6**.

This is a maintenance release on the 2.x branch that fixes a few bugs and is designed for Vert.x 2 production users who cannot upgrade to 3.0 immediately.

For the latest production version for new projects please see [Vert.x 3.0](http://vertx.io).

Fixes in this release include:

* _runZip_ - fix bugs in unpacking zips
* _HttpClient_ - make sure writeHead is set to true before connect
* Upgrade to Hazelcast 3.5 to fix bug in `Multimap` state.
* Workaround for Hazelcast bug which could result in inconsistent cluster state if multiple nodes shutdown concurrently
* Clustering fixes related to clearing up state in case of event bus connections closing and on close of event bus.
* Fix message replies to nodes other than the node the SockJS bridge is deployed on.

The artifacts has been deployed to [Maven Central](http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22io.vertx%22%20AND%20v%3A%222.1.6%22), and you can get the distribution on [Bintray](https://bintray.com/vertx/downloads/distribution/2.1.6/view).
