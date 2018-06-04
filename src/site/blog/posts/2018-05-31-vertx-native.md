---
title: Eclipse Vert.x goes Native
template: post.html
date: 2018-06-04
author: jotschi
---

I this blog post I would like to give you a preview on native image generation of Vert.x applications using GraalVM.

With [GraalVM](https://www.graalvm.org/) it is possible to generate native executables.
These executables can be directly run without the need of an installed JVM.


## Benefits
* The start up time is way faster. It is no longer required to wait for the start up of the JVM. The application is usually up and running in a matter of milliseconds.

* Reduced memory footprint. I measured 40 MB memory usage (RSS) for the Vert.x Web application which I'm going to showcase.

* Smaller Containers. No JVM means no overhead. All the needed parts are already contained within the executable. This can be very beneficial when building deployable container images.

## Demo Project

For the demo application I choose a very basic hello world [Vert.x Web](https://vertx.io/docs/vertx-web/java/) server.

```java
package de.jotschi.examples;

import java.io.File;

import io.vertx.core.Vertx;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import io.vertx.core.logging.SLF4JLogDelegateFactory;
import io.vertx.ext.web.Router;

public class Runner {

	public static void main(String[] args) {
		// Use logback for logging
		File logbackFile = new File("config", "logback.xml");
		System.setProperty("logback.configurationFile", logbackFile.getAbsolutePath());
		System.setProperty(LoggerFactory.LOGGER_DELEGATE_FACTORY_CLASS_NAME, SLF4JLogDelegateFactory.class.getName());
		Logger log = LoggerFactory.getLogger(Runner.class);

		// Setup the http server
		log.info("Starting server for: http://localhost:8080/hello");
		Vertx vertx = Vertx.vertx();
		Router router = Router.router(vertx);

		router.route("/hello").handler(rc -> {
			log.info("Got hello request");
			rc.response().end("World");
		});

		vertx.createHttpServer()
			.requestHandler(router::accept)
			.listen(8080);

	}

}
```

## GraalVM

[GraalVM](https://www.graalvm.org/)runs a static analysis on the generated application in order to find the reachable code.
This process which is run within the [Substrate VM](https://github.com/oracle/graal/tree/master/substratevm) will lead to the generation of the native image.

### Limitations

Due to the nature of the static analysis Substrate VM also has some [limitations](https://github.com/oracle/graal/blob/master/substratevm/LIMITATIONS.md).

Dynamic class loading and unloading for example is not supported because this would in essence alter the available code during runtime. 

Reflection is only partially supported and requires some manual steps which we will cover later on.

### Patches / Workarounds

[NOTE Work in progress | Next we need to apply some patches / workarounds. Keep in mind that native image generation is a fairly new topic and the these workarounds will hopefully no longer be required once the Substrate VM and Netty have better support for each other.]

I did not manage to get native epoll, kqueue and SSL integration to work with native images.
These parts are heavily optimized within Netty and use JNI to directly access the OS features.
Substrate VM supports JNI and could in theory integrate these native libraries. 

I created a [reproducer](https://github.com/Jotschi/vertx-graalvm-native-image-test/tree/netty-native-epoll)
 and an [issue](https://github.com/oracle/graal/issues/442) so hopefully these problems can be addressed soon.

### Vert.x Transport

First I needed to patch the `io.vertx.core.net.impl.transport.Transport` class in order to prevent the loading of EPoll and KQueue native support. Otherwise Substrate VM will try to load these classes and fail.

```java
public class Transport {
…
  /**
   * The native transport, it may be {@code null} or failed.
   */
  public static Transport nativeTransport() {
    // Patched: I remove the native transport discovery. 
    // The imports would be picked up by substrate 
    // and cause further issues. 
    return null;
  }
…
}
```

### Netty SSL

Native SSL support is another problematic area. I created a patched dummy `io.netty.handler.ssl.ReferenceCountedOpenSslEngine` class in order to prevent Substrate VM from digging deeper into the SSL code of Netty.

Next we need to set up the reflection configuration within `reflectconfigs/netty.json`.

Netty uses reflection to instantiate the socket channels. This is done in the ReflectiveChannelFactory. We need to tell Substrate VM how classes of type NioServerSocketChannel  and NioSocketChannel can be instantiated. 

```
[
  {
    "name" : "io.netty.channel.socket.nio.NioSocketChannel",
    "methods" : [
      { "name" : "<init>", "parameterTypes" : [] }
    ]
  },
  {
    "name" : "io.netty.channel.socket.nio.NioServerSocketChannel",
    "methods" : [
      { "name" : "<init>", "parameterTypes" : [] }
    ]
  }
]
```

If you want to learn more about the state of Netty and GraalVM I can recommend this [GraalVM Blogpost](https://medium.com/graalvm/instant-netty-startup-using-graalvm-native-image-generation-ed6f14ff7692) by Codrut Stancu.

## Building

Finally we can build our maven project to generate a shaded jar.

```bash
mvn clean package
```

Next we need the GraalVM package. You can download it from the [GraalVM website](https://www.graalvm.org/).

We use the shaded jar as the input source for the `native-image` command which will generate the executable.

```bash
$GRAALVMDIR/bin/native-image \
 --verbose \
 --no-server \
 -Dio.netty.noUnsafe=true  \
 -H:ReflectionConfigurationFiles=./reflectconfigs/netty.json \
 -H:+ReportUnsupportedElementsAtRuntime \
 -Dfile.encoding=UTF-8 \
 -jar target/vertx-graalvm-native-image-test-0.0.1-SNAPSHOT.jar
``` 

## Result

Finally we end up with an 27 MB `vertx-graalvm-native-image-test-0.0.1-SNAPSHOT` executable which we can run.

```bash
$ ldd vertx-graalvm-native-image-test-0.0.1-SNAPSHOT 
  linux-vdso.so.1 (0x00007ffc65be8000)
  libdl.so.2 => /lib/x86_64-linux-gnu/libdl.so.2 (0x00007f8e892f0000)
  libpthread.so.0 => /lib/x86_64-linux-gnu/libpthread.so.0 (0x00007f8e890d3000)
  libz.so.1 => /lib/x86_64-linux-gnu/libz.so.1 (0x00007f8e88eb9000)
  librt.so.1 => /lib/x86_64-linux-gnu/librt.so.1 (0x00007f8e88cb1000)
  libcrypt.so.1 => /lib/x86_64-linux-gnu/libcrypt.so.1 (0x00007f8e88a79000)
  libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f8e886da000)
  /lib64/ld-linux-x86-64.so.2 (0x00007f8e8afb7000)
```

### Memory

```bash
/usr/bin/time -f "\nmaxRSS\t%MkB" java -jar target/vertx-graalvm-native-image-test-0.0.1-SNAPSHOT.jar 
/usr/bin/time -f "\nmaxRSS\t%MkB" ./vertx-graalvm-native-image-test-0.0.1-SNAPSHOT 
```

* Native Image: 40 MB
* Java 10: 125 MB

The full project can be found on [GitHub](https://github.com/Jotschi/vertx-graalvm-native-image-test).

If you want to read more on the topic I can also recommend [this article](
https://sites.google.com/a/athaydes.com/renato-athaydes/posts/a7mbnative-imagejavaappthatrunsin30msandusesonly4mbofram) by Renato Athaydes in which he demonstrates how to create a very small light weight low memory application using GraalVM.


Thanks for reading. If you have any further questions or feedback don't hesitate to send me a tweet to [@Jotschi](https://twitter.com/Jotschi/).
