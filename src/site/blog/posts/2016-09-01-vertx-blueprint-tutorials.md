---
title: Vert.x Blueprint Tutorials
date: 2016-09-01
template: post.html
author: sczyh30
---

The Vert.x Blueprint project aims to provide guidelines to Vert.x users to implement various applications such as message-based applications and microservices. This post introduces the content of each blueprints.

This work has been done in the context of a [Google Summer of Code project](https://developers.google.com/open-source/gsoc/) .

# Overview

The blueprint project contains three parts: **Todo Backend**, **Vert.x Kue** and **Online Shopping Microservice**. Both runnable code and very detailed documents and tutorials (both in English and Chinese) are provided.

# Vert.x Blueprint - Todo Backend

**Repository**: [sczyh30/vertx-blueprint-todo-backend](https://github.com/sczyh30/vertx-blueprint-todo-backend).

This blueprint is a todo-backend implementation using Vert.x and various persistence (e.g. Redis or MySQL). It is intended to be an introduction to basic Vert.x web RESTful service development. From this blueprint, developers  learn:

- What is Vert.x and its principles
- What is and how to use `Verticle`
- How to develop a REST API using [Vert.x Web](http://vertx.io/docs/vertx-web/java/)
- How to make use of **asynchronous development model**
- `Future`-based asynchronous patterns
- How to use persistence such as *Redis* and *MySQL* with the help of Vert.x async data

The tutorials are:

- [Vert.x Blueprint - Todo Backend (English version)](http://sczyh30.github.io/vertx-blueprint-todo-backend/)
- [Vert.x Blueprint - Todo Backend (Chinese version)](http://sczyh30.github.io/vertx-blueprint-todo-backend/cn/)

![](https://raw.githubusercontent.com/sczyh30/vertx-blueprint-todo-backend/master/docs/img/vertx-todobackend-ui.png)

# Vert.x Blueprint - Vert.x Kue

**Repository**: [sczyh30/vertx-blueprint-job-queue](https://github.com/sczyh30/vertx-blueprint-job-queue).

This blueprint is a priority job queue developed with Vert.x and backed by Redis. It's a Vert.x implementation version of [Automattic/kue](https://github.com/Automattic/kue) that can be used in production.

The list of features provided by Vert.x Kue is available here: [Vert.x Kue Features](https://github.com/sczyh30/vertx-blueprint-job-queue/blob/master/docs/en/vertx-kue-features-en.md).

This blueprint is intended to be an introduction to message-based application development using Vert.x. From this blueprint, developers learn:

- How to make use of **Vert.x Event Bus** (distributed)
- How to develop message based applications with Vert.x
- Event and message patterns with the event bus (Pub/sub, point to point)
- How to design clustered Vert.x applications
- How to design and implement a job queue
- How to use **Vert.x Service Proxy**
- More complex usage of [Vert.x Redis](http://vertx.io/docs/vertx-redis-client/java/)

The tutorial are:

- English version
  - [Vert.x Kue Core Tutorial - English Version](http://sczyh30.github.io/vertx-blueprint-job-queue/kue-core/index.html)
  - [Vert.x Kue Web Tutorial - English Version](http://sczyh30.github.io/vertx-blueprint-job-queue/kue-http/index.html)
- Chinese version
  - [Vert.x 蓝图 - Vert.x Kue (Core部分)](http://sczyh30.github.io/vertx-blueprint-job-queue/cn/kue-core/index.html)
  - [Vert.x 蓝图 - Vert.x Kue (Web部分)](http://sczyh30.github.io/vertx-blueprint-job-queue/cn/kue-http/index.html)

![](https://raw.githubusercontent.com/sczyh30/vertx-blueprint-job-queue/master/docs/images/vertx_kue_ui_1.png)

# Vert.x Blueprint - Online Shopping Microservice

**Repository**: [sczyh30/vertx-blueprint-microservice](https://github.com/sczyh30/vertx-blueprint-microservice).

This blueprint is a micro-shop microservice application developed with Vert.x. It is intended to be an illustration on how to develop microservice applications using Vert.x. From this blueprint, developers learn:

- Microservice development with Vert.x
- Asynchronous development model
- Reactive patterns
- Event sourcing patterns
- Asynchronous RPC on the clustered event bus
- Various type of services (e.g. HTTP endpoint, message source, event bus service)
- Vert.x Service Discovery
- Vert.x Circuit Breaker
- Microservice with polyglot persistence
- How to implement an API Gateway
- Global authentication (OAuth 2 + Keycloak)

And many more things...

The tutorial are:

- English version
  - [Vert.x Microservice Blueprint Tutorial - Development](http://sczyh30.github.io/vertx-blueprint-microservice/index.html)
  - [Vert.x Microservice Blueprint Tutorial - API Gateway](http://sczyh30.github.io/vertx-blueprint-microservice/api-gateway.html)
- Chinese version
  - [Vert.x 蓝图 - Micro Shop 微服务实战 (开发篇)](http://sczyh30.github.io/vertx-blueprint-microservice/cn/index.html)
  - [Vert.x 蓝图 - Micro Shop 微服务实战 (API Gateway)](http://sczyh30.github.io/vertx-blueprint-microservice/cn/api-gateway.html)

![](https://raw.githubusercontent.com/sczyh30/vertx-blueprint-microservice/master/docs/images/shopping-spa-product-detail.png)

![](https://raw.githubusercontent.com/sczyh30/vertx-blueprint-microservice/master/docs/images/monitor-dashboard.png)


Enjoy the code carnival with Vert.x!
