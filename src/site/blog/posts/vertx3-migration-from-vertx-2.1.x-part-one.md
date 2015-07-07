---
title: Checklist for Migrating from Vert.x 2.1.x to Vert.x 3 - Part One
template: post.html
date: 2015-07-6
author: bytor99999
draft: true
---
## We are in the process of converting our Vert.x 2.1.5 application to Vert.x 3.0.

So while upgrading our application, I thought I should note down all the changes that we had to do in the process.
Since Vert.x 3 is a major upgrade from the previous version,with so many changes. It requires re-thinking your current 2.x Vert.x application.
There are new classes, new apis, and a new package structure that has greatly simplified things that we used to have to work
around. Therefore in our upgrade it required us to refactor and remove any unnecessary "hacks" that weren't
available in 2 that are now a part of Vert.x 3 that you really want and need to take advantage of. (I don't mean there are hacks in 3.x, just that we had to in our application with Vert.x 2.x)

There are Metrics, and Clustered shared data, with locking and many more features that are amazing new additions. These are things we had to hack into our application with Vert.x 2.x. We added
our own MetricsRegistry from DropWizard which meant making our own Main class that called Vert.x's Starter class after starting up the registry, but only in our Devops server deploys, not our developer machines
And we have to build our own distributed locked of clustered data that also required writing a comprehensive distributed timers. (The timers got fixed with a better actor model). But now we can use what Vert.x gives
us internally for those use cases.

This blog post is part one, as I am sure there will be some new changes that we need to do that we haven't gotten to yet.
Which as we go, will post in part two. Also that this post is a work in progress in that whenever you are upgrading and
refactoring your code, it doesn't leave much time for taking detailed notes, or writing beautiful prose. I am a terrible
writer even when I can fully concentrate on it. So the first draft will just be a list of my notes. These notes are not in
any particular order, but some things like tests you might want to save for last. (Just DON'T delete your tests, tests
are very important)

One of the first things that Vert.x has changed is the whole classloader setup. Read the Vert.x Docs for more information
but basically, we have a flat classloader system now. YAY! And one of the first things I noticed that is gone is the Platform module.

## Changes we have made.

### Dependency changes

1. So the first thing we did was to remove the vert.x-platform dependency from our pom file (Build dependency file of whatever build system you use)
This also means that you will be removing any import statements from your code that has ".platform. Which leads us to the next point.

2. Change all the imports for Vertx. from org.vertx to io.vertx. This could be a lot of work, as it is in every class you use Vert.x in.
We had at least 250 locations to change here. Some classes have moved packages and “jars” that have them,
so there will be some new jars to include as dependencies and different import statements for them.

3. If using a language other than Java, change the dependency to vertx-lang-<<language>>

4. Remove any modules references that are using Vert.x 2.x stuff. You can get an odd error like
The type org.vertx.java.core.json.JsonObject cannot be resolved. It is indirectly referenced from required .class files

5. testtools dependency is gone. There is now Vertx-unit. So all your previous tests need to be completely re-written in the new style. This can be really difficult and time consuming as the tests you already have written really do need to be re-written from scratch. But these tests are also the backbone in knowing if your code is working. So this could take months if you have a really full set of test suites already. Also note the list below is to convert your JUnit Integration tests. as vertx-unit first and foremost provides its own testing framework/suite but it also works in JUnit, and if you are using JUnit you need to do the following

  - Remove all the imports to TestTools, including VertxAssert. I would do a find/replace to replace all the VertxAssert to “testContext”
  for when you have to add TestContext to all your @Test methods. I recommend naming the paramter testContext.
  Just to put more context, into your context. cause if you just have "context" as your parameter name,
  how do you know what context the context is? Sorry, that was too much fun. Basically, what I am saying is if you have say
  Spring ApplicationContext in with your integration tests with Vert.x what does "context" represent? Spring or Vert.x test context.
  - Add @RunWith(VertxUnitRunner.class) above your test class
  - Remove any VertxAssert.testComplete() those are gone. need TestContext.async().complete(). It is also important to understand what async() means. When to call it, when to complete it. It also allows you to do multiple async() calls and nested ones. I think I needed that when I had a test that was a longer use case of many messages being sent, but only after responses to other ones occurred. For instance, to do chat in our app, you have to connect, subscribe, friend someone, then you can send a chat message. So that is 4 total Vert.x Messages sent from the Test client. And you can subscribe until connect completed, and you can send or receive messages unless you are subscribed and have a friend. So we need to have a few async() calls in that scenario.
  - What is in your start method override. Make that an @Before.
  - What is in your stop method override. Make that an @After.
  - If you have your assertions have custom message strings to log out when they fail, that parameter is now at the end of the assert method call. Yes, this one can be painful.


### Build Changes

1) Remove all vertx maven plugin code to generate modules, instead create fat jars, which requires adding the Shade maven plugin to put all jar files into a big fat jar.
vertx-examples project has simplest-maven which has the stuff to create the fat jar. simplest-gradle would be the gradle equivalent
https://github.com/vert-x3/vertx-examples/tree/master/maven-simplest
https://github.com/vert-x3/vertx-examples/tree/master/gradle-simplest

2) If you were running your application with runMod or something like that then you need to create a fatjar, changing the build file.
https://github.com/vert-x3/vertx-examples/blob/master/maven-simplest/pom.xml

and create a Main class like here
https://github.com/vert-x3/vertx-examples/blob/master/maven-simplest/src/main/java/io/vertx/example/HelloWorldEmbedded.java



### Class/Code Changes

1) Verticle is now an interface and not a class to extend, so using Groovy as an example you now extend GroovyVerticle. In Java extend AbstractVerticle instead.

2) There is no registerHandler on the eventBus anymore. So everywhere you do that has to change to create/call consumer() and to unregister that handler, you
have to have a reference to the MessageConsumer that consumer() call returns and call its unregister method.

3) JsonObject.toMap() changed to JsonObject.getMap()

4) JsonObject also removed all the putXXX methods with just one put method with overloaded versions for different types.

5) JsonObjectMessage no longer exists. What replaces it depends on what you are doing. Meaning, if it is an async callback to a deploy, you will get a
Message instance back that has succeeded() or failed() methods as well as body() to check any results. If it is a Consumer it is typically a straight forward
JsonObject. If you are in Groovy it is also a JsonObject, but the body() is a Map which you can use directly now, instead of having to convert from JSonObject to Map.

6) There isn't a container variable in Verticles anymore for deploying verticles and also a config file. You need to use vertx.getOrCreateContext().config() to get to it. I used that in the SockJS Example code above.

7) SharedData no longer has shared sets. It has a Map of SharedData, so an entry in that Map of shared data could be the name of the set as the key, and Set type as the value. It actually gives you more flexibility
of what you put into Shared data, so this is actually a big win for us.

8) Getting the writeHandlerID from a Socket type, is now a method call instead of .writeHandlerID. (Groovy) So .writeHandlerID()

9) SockJSSocket is in vertx-web package now, so include it to get the class.

10) There isn't a SockJSServer class anymore either. So you will create a WebServer, a Router
 and set SSL (if you are using SSL on the WebServer) then create a SockJSHandler to assign to the router via the route() method and handler() methods in the Router api.
 Here is an example of our code. Although I haven't tested it yet. ;)

 ```groovy

     public class MyVerticle extends GroovyVerticle {

     Router router

     @Override
       void start() throws Exception {

         router = Router.router(vertx)
         (Map<String, Object>) sslConfig = (Map<String, Object>)vertx.getOrCreateContext().config().get('ssl')
           HttpServer sslHttpServer = vertx.createHttpServer(SSL: true,
               keyStorePath: sslConfig.get("keystore"),
               keyStorePassword: sslConfig.get("password"))

           startWebApiServer(sslHttpServer)

         }
       }
       private void startWebApiServer(final HttpServer httpServer) {
         def sockHandler = SockJSHandler.create(vertx, [:])
         sockHandler.socketHandler { SockJSSocket ws ->
                 sockJSConnectHandler(ws)
         }
         router.route("/hdpoker").handler(sockHandler)
         httpServer.requestHandler(router.&accept)
         httpServer.listen()
       }

     }
 ```

#### More testing change

1) Testing messages in Integration Tests. To tell the test method that this has async calls put
Async async = testContext.async()
as the first line in the test method. Yes, this is a little redundant from above, but I always forgot to put async() calls in my integration tests and they would pass so quickly,
without sending anything out, because it wasn't waiting anymore

### Runtime changes

1) If you don’t use Vert.x built in Logging and need to say use slf4j, then remember to
“To do this you should set a system property called vertx.logger-delegate-factory-class-name with the name of a Java class which implements the interface LoggerFactory. We provide pre-built implementations for Log4J and SLF4J with the class names io.vertx.core.logging.Log4jLogDelegateFactory and io.vertx.core.logging.SLF4JLogDelegateFactory”


## Still working

Well, that is all I have for you folks so far. We are still not done, as we haven't gotten our application running with real clients just yet. But we do have all our integration tests from before completely passing
so, if something does come up, it should be a small one (KNOCK ON WOOD)

Please feel free to post on the Vert.x Google Group with any comments or suggestions on what to add to this blog post or for Part Two.

Thanks

Mark S