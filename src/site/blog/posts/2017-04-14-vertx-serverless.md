---
title: Dynamic Routing in Serverless Microservice with Vert.x Event Bus
template: post.html
date: 2017-04-14
author: bytekast
---

[NOTE this is a re-publication of the following [blog post](https://www.rowellbelen.com/dynamic-routing-in-serverless-microservice-with-vert-x-event-bus/)]


## SERVERLESS FRAMEWORK

The [Serverless Framework](https://serverless.com) has become the *De Facto* toolkit for building and deploying Serverless functions or applications. Its community has done a great job advancing the tools around Serverless architecture.

However, in the Serverless community there is debate among developers on whether a single **AWS Lambda** function should only be responsible for a single API endpoint. My answer, based on my real-world production experience, is **NO**. 

Imagine if you are building a set of APIs with **10** endpoints and you need to deploy the APIs to **DEV**, **STAGE** and **PROD** environments. Now you are looking at **30** different functions to version, deploy and manage - not to mention the *Copy & Paste* code and configuration that will result from this type of set-up. **NO THANKS!!!** 

I believe a more pragmatic approach is **1 Lambda Function** == **1 Microservice**.

For example, if you were building a **User Microservice** with basic **CRUD** functionality, you should implement `CREATE`, `READ`, `UPDATE` and `DELETE` in a **single** Lambda function. In the code, you should resolve the desired action by inspecting the request or the context.

## VERT.X TO THE RESCUE

There are many benefits to using **Vert.x** in any application. With **Vert.x**, you get a rock-solid and lightweight toolkit for building **reactive**, **highly performant**, **event-driven** and **non-blocking** applications. The toolkit even provides asynchronous *APIs* for accessing traditional blocking drivers such as **[JDBC](http://vertx.io/docs/vertx-jdbc-client/groovy/)**.

However, for this example, we will mainly focus on the [Event Bus](http://vertx.io/docs/vertx-core/groovy/#event_bus). The event bus allows different parts of your application to communicate with each other via event messages. It supports *publish/subscribe*, *point to point*, and *request-response messaging*.

For the **User Microservice** example above, we could treat the combination of the `HTTP METHOD` and `RESOURCE PATH` as a unique event channel, and register the subscribers/handlers to respond appropriately.

Let's dive right in.

## GOAL:

Create a *reactive*, *message-driven*, *asynchronous* **User Microservice** with `GET`, `POST`, `DELETE`, `PUT` CRUD operations in a *single* **[AWS Lambda Function](aws.amazon.com/lambda)** using the [Serverless Framework](https://serverless.com)

`Serverless stack definition`:
<script src="https://gist.github.com/bytekast/48daa2ca479156c98d2735cca181ef30.js"></script>

## SOLUTION:

Use [Vert.x](http://vertx.io)'s [Event Bus](http://vertx.io/docs/vertx-core/groovy/#event_bus) to handle **dynamic routing** to **event handlers** based on *HTTP method* and *resource path* from the API input.

`Lambda Handler`:
<script src="https://gist.github.com/bytekast/d5a544f8cdcd327a12010100b2ba2d66.js"></script>

## CODE REVIEW

Lines `14-19` initializes the **Vert.x** instance. AWS Lambda will hold on to this instance for the life of the container/**JVM**. It is reused in subsequent requests.

Line `17` registers the **User Service** *handlers*

Line `22` defines the **main handler** method that is called when the **Lambda function** is invoked.

Line `27` sends the Lambda function input to the (dynamic) **address** where handlers are waiting to respond. 

Lines `44-66` defines the specific *handlers* and binds them to the appropriate *channels* (http method + resource path)

## SUMMARY
 
As you can see, [Vert.x](http://vertx.io)'s [Event Bus](http://vertx.io/docs/vertx-core/groovy/#event_bus) makes it very easy to dynamically support multiple routes in a single **Serverless** function. This reduces the number of functions you have to manage, deploy and maintain in **AWS**. In addition, you gain access to asynchronous, non-blocking APIs that come standard with **Vert.x**.

> Serverless + Vert.x = BLISS



