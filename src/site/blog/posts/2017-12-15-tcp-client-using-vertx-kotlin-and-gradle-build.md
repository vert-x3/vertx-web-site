---
title: TCP Client using Eclipse Vert.x, Kotlin and Gradle build
template: post.html
date: 2017-12-20
author: usmansaleem
---

As part of my hobby project to control RaspberryPi using Google Home Mini and/or Alexa, I wanted to write a very simple TCP client that keeps a connection open to one of my custom written server in cloud (I will write another blog post to cover the server side on a later date). The requirement of the client is to send a shared secret upon connecting and then keep waiting for message from server. Vert.x, Kotlin and Gradle allow rapid development of such project. The generated jar can be executed on Raspberry Pi. These steps outline the project setup and related source code to showcase a Vert.x and Kotlin project with Gradle.

## Project Directory Structure
From command line (or via Windows Explorer, whatever you prefer to use) create a directory for project,for instance `vertx-net-client`. Since we are using Kotlin, we will place all Kotlin files in `src/main/kotlin` folder. The `src/main/resources` folder will contain our logging configuration related files.

```
cd vertx-net-client
mkdir -p src/main/kotlin
mkdir -p src/main/resources
```

### Project Files
We need to add following files in the project

* `.gitignore`
If you want to check your project into git, you may consider adding following `.gitignore` file at root of your project

<script src="https://gist.github.com/usmansaleem/b5838484a20cb8b08f236f2265ad7a8e.js"></script>

* `logback.xml`
This example is using slf4j and logback for logging. If you decide to use it in your project, you may also add following logback.xml file in `src/main/resources`. Modify it as per your requirements. This example will
log on console.

<script src="https://gist.github.com/usmansaleem/750c6d1cad0721b52be2ff00f758fb9f.js"></script>

## Gradle Setup
We will use Gradle build system for this project. If you don’t already have Gradle available on your system, download and unzip gradle in a directory of your choice (`$GRADLE_HOME` is used here to represent this directory). This gradle distribution will be used as a starting point to create Gradle wrapper scripts for our project. These scripts will allow our project to download and use correct version of gradle distribution automatically without messing up system. Really useful when building your project on CI tool or on any other developer's machine.

Run following command in project's directory

```
$GRADLE_HOME/bin/gradle wrapper
```

The above commands will generate following files and directories.

```
gradle/  gradlew  gradlew.bat
```

### Gradle build file `build.gradle`
Create (and/or copy and modify) following `build.gradle` in your project's root directory. Our example gradle build file is using [vertx-gradle-plugin](https://github.com/jponge/vertx-gradle-plugin/).

<script src="https://gist.github.com/usmansaleem/e723f25b827e0a925eaef2957a80132d.js"></script>

In the project directory, run following command to download local gradle distribution:

```
./gradlew
```
(or `.\gradlew.bat` if in Windows)

At this stage we should have following file structure. This is also a good time to commit changes if you are working with git.

* `.gitignore`                              
* `build.gradle`                            
* `gradle/wrapper/gradle-wrapper.jar`       
* `gradle/wrapper/gradle-wrapper.properties`
* `gradlew`                                 
* `gradlew.bat`
* `src/main/resources/logback.xml`

Now that our project structure is ready, time to add the meat of the project. You may use any IDE of your choice. My preference is IntelliJ IDEA.

Create a new package under `src/main/kotlin`. The package name should be adapted from the following section of `build.gradle`

```
vertx {
    mainVerticle = "info.usmans.blog.vertx.NetClientVerticle"
}
```

From the above example, the package name is `info.usmans.blog.vertx`

Add a new Kotlin Class/file in `src/main/kotlin/info/usmans/blog/vertx` as `NetClientVerticle.kt`

The contents of this class is as follows

<script src="https://gist.github.com/usmansaleem/2a176a7b752fcb72f7f31964809696fe.js"></script>

## Explaining the Code
The `fun main(args: Array<String>)` is not strictly required, it quickly allows running the Vert.x verticle from within IDE. You will also notice a small hack in the method for setting system property `vertx.disableDnsResolver` which is to avoid a Netty bug that I observed when running on Windows machine and remote server is down. Of course, since we are using vertx-gradle-plugin, we can also use `gradle vertxRun` to run our verticle. In this case the `main` method will not get called.

The `override fun start()` method calls `fireReconnectTimer` which in turn calls `reconnect` method. `reconnect` method contains the connection logic to server as well as it calls `fireReconnectTimer` if it is unable to connect to server or disconnects from server. In `reconnect` method the `socket.handler` gets called when server send message to client.

```
socket.handler({ data ->
                        logger.info("Data received: ${data}")
                        //TODO: Do the work here ...
               })
```

## Distributing the project
To create redistributable jar, use `./gradlew shadowJar` command. Or if using IntelliJ: from Gradle projects, Tasks, shadow, shadowJar (right click run). This command will generate `./build/libs/vertx-net-client-fat.jar`.

### Executing the client

The client jar can be executed using following command:

```
 java -DserverHost=127.0.0.1 -DserverPort=8888 -DconnectMessage="hello" -jar vertx-net-client-full.jar
```

If you wish to use SLF4J for Vert.x internal logging, you need to pass system property `vertx.logger-delegate-factory-class-name` with value of `io.vertx.core.logging.SLF4JLogDelegateFactory`. The final command would look like:

```
java -DserverHost=127.0.0.1 -DserverPort=8888 -DconnectMessage="hello" -Dvertx.logger-delegate-factory-class-name="io.vertx.core.logging.SLF4JLogDelegateFactory" -jar vertx-net-client-full.jar
```

You can configure Vert.x logging levels in logback.xml file if required.

## Conclusion
This post describes how easy it is to create a simple TCP client using Vert.x, Kotlin and Gradle build system. Hopefully the techniques shown here will serve as a starting point for your next DIY project.

[INFO Info | This post is adapted and reproduced from [author's blog post](https://usmans.info/usmansaleem/blog/tcp_client_using_vertx_kotlin_gradle)]
