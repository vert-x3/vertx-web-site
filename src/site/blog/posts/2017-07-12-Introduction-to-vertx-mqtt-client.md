---
title: Introduction to vertx-mqtt-client
template: post.html
date: 2017-07-12
author: Sammesr21
draft: true
---

# Intro 
I am an GSoC 2017 student and the project I'm working on is an MQTT client for Vert.x JVM toolkit. It designed in Vert.x ideology, which also means, that all operations are non blocking and you, as a user, can be notified when some event happens.

In this article, i would like to give you a quick overview of Vert.x, MQTT and how my project catches these things together.

#### What is Vert.x?
Basically, Vert.x was created in 2011 by [Tim Fox](https://github.com/purplefox). Today it positioned as a tool-kit for building reactive applications on the JVM. Vert.x reactive ideology is different from common procedural style and standard Java library design. To make Vert.x comfortable and convenient to use we should rewrite a significant part of standard library. That also means that we should have own primitives for working with different protocols and in many different areas otherwise, we will not take advantage of Vert.x usage.

#### What is MQTT?
[MQTT](http://mqtt.org) is an extremely lightweight publish/subscribe messaging transport protocol designed for IoT needs. It is useful for connections with remote locations where a small code footprint is required and/or network bandwidth is at a premium.
.
### Why we must have them together?
As I sad, Vert.x seeks to create its own tools to work with different protocols. MQTT is not an exception.

The second prerequisite is that Vert.x project already has [own MQTT-server](https://github.com/vert-x3/vertx-mqtt-server). Why it should not have a client one?

One more fact connected with ideologies. They are pretty similar. For example, Vert.x's Event Bus, as in MQTT, uses the same publish/subscribe model, but for communication between verticles.
### First results

I and my mentor [Paolo](https://github.com/ppatierno) had been working on the initial implementation of Vert.x MQTT client for a month and now you can see first results [here](https://github.com/vert-x3/vertx-mqtt-client). In addition to the source files, you can find a documentation there. 

The next my blog posts will be dedicated to the project, its features and performance. Also, one day I will make a couple of tutorials and provide a real examples with live brokers.

Cheers!