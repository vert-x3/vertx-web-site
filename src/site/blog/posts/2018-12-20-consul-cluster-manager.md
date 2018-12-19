---
title: Vert.x Consul Cluster Manager is released!
template: post.html
date: 2018-12-20
author: romalev
draft: true
---

# Introduction

I am pleased to announce new Consul based cluster manager for Vert.x ecosystem. As we know cluster managers are
pluggable and if you are already using Consul in your infrastructure this might be a perfect fit for you 
to utilize this implementation for the following purposes:

- discovery and group membership of Vert.x nodes in a cluster Maintaining cluster wide topic subscriber lists (so we know which nodes are interested in which event bus addresses)
- distributed map support;
- distributed locks;
- distributed counters;

Note : Cluster managers do not handle the event bus inter-node transport, this is done directly by Vert.x with TCP connections.

# Implementation details 

Given cluster manager fully utilizes [vertx-consul-client](https://vertx.io/docs/vertx-consul-client/java/) to interact with Consul. 
It is fully asynchronous, involves only event loop thread pool and default vert.x worker pool.   
   
# Restrictions 

- Consul itself has restriction on value's size you want to ship to KV store - it's 512KB, which means you won't be able to ship anything that is greater than 512KB when using clustered async map from SharedData interface.
- Given cluster manager is only compliant with Vert.x 3.6.0+ release.

# How to use

## Gradle

```groovy

repositories {
    //...
    maven { url 'https://jitpack.io' }
}

compile 'com.github.romalev:vertx-consul-cluster-manager:v1.0'
```

## Maven

```xml
<project>
  <repositories>
    <repository>
      <id>jitpack</id>
      <url>https://jitpack.io</url>
    </repository>
  </repositories>
</project>

<dependency>
  <groupId>com.github.romalev</groupId>
  <artifactId>vertx-consul-cluster-manager</artifactId>
  <version>v1.0</version>
</dependency>
```

There's more than one way to create an instance of consul cluster manager. 

- Defaut one: 

```java
// Consul agent should be running on localhost:8500.
ConsulClusterManager consulClusterManager = new ConsulClusterManager();   
```

- Excplicilty specifying configuration: 

```java
JsonObject options = new JsonObject()
.put("host", "localhost") // host on which consul agent is running, if not specified default host will be used which is "localhost".
.put("port", consulAgentPort) // port on wich consul agent is runing, if not specified default port will be used which is "8500".
/*
 * There's an option to utilize built-in internal caching. 
 * @{Code false} - enable internal caching of event bus subscribers - this will give us better latency but stale reads (stale subsribers) might appear.  
 * @{Code true} - disable internal caching of event bus subscribers - this will give us stronger consistency in terms of fetching event bus subscribers, 
 * but this will result in having much more round trips to consul kv store where event bus subs are being kept.
 */
.put("preferConsistency", false)
/*
 * There's also an option to specify explictly host address on which given cluster manager will be operating on. 
 * By defult InetAddress.getLocalHost().getHostAddress() will be executed.
 * Linux systems enumerate the loopback network interface the same way as regular LAN network interfaces, but the JDK       
 * InetAddress.getLocalHost method does not specify the algorithm used to select the address returned under such circumstances, and will 
 * often return the loopback address, which is not valid for network communication.
 */
 .put("nodeHost", "10.0.0.1");
 // consul client options can be additionally specified as needed.
ConsulClusterManager consulClusterManager = new ConsulClusterManager(options);
 ```
 
- Once cluster manager instance is created we can easily create clustered vertx. Voilà! 

```java
VertxOptions vertxOptions = new VertxOptions();
vertxOptions.setClusterManager(consulClusterManager);
Vertx.clusteredVertx(vertxOptions, res -> {
    if (res.succeeded()) {
	    // clustered vertx instance has been successfully created!
	    Vertx vertx = res.result(); 
	} else {
	    // something went wrong :( 
	}
}
```

There's a small project I've developed to show how this SPI implementation might be utilized. See: https://github.com/romalev/vertx-consul-cluster-manager-tester.
    
