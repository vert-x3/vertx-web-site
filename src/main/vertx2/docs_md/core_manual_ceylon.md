<!--
This work is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/3.0/ or send
a letter to Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
-->

[TOC]
# Vert.x for Ceylon

Vert.x is a lightweight, high performance application platform for the JVM that's designed for modern mobile, web,
and enterprise applications.

The original [Vert.x documentation](http://vertx.io/docs.html) explains how to use Vert.x. This Ceylon module is a port
of the Vert.x API to Ceylon, with this API you can:

- Embed Vert.x in a Ceylon application
- Use the Vert.x API
- Verticles are not covered by this API but are managed by the `io.vertx.ceylon.platform` Ceylon module.

## Installation

We suppose `$VERTX_HOME` points to Vert.x 2.x. Edit `$VERTX_HOME/conf/langs.properties` lang configuration:

- declare the Ceylon Verticle Factory with `ceylon=io.vertx~lang-ceylon~1.0.1:org.vertx.ceylon.platform.impl.CeylonVerticleFactory`
- declare the file mapping with `.ceylon=ceylon`

## Running a Verticle

Running a Verticle is very easy to achieve and it can be done in several ways.

### from a Verticle source

Create a new `HelloWorldServer.ceylon` source file:

    import io.vertx.ceylon.platform { Verticle, Container }
    import io.vertx.ceylon.core { Vertx }
    import io.vertx.ceylon.core.http { HttpServerRequest }

    shared class HelloWorldServer() extends Verticle() {

      shared actual void start(Vertx vertx, Container container) {
        vertx.createHttpServer().requestHandler(void (HttpServerRequest req) {
          req.response.headers { "Content-Type" -> "text/plain" };
          req.response.end("Hello World");
        }).listen(8080);
      }
    }

Run this file with the `vertx` command:

    % vertx run HelloWorldServer.ceylon
    Module io.vertx~lang-ceylon~1.0.1 successfully installed
    Create temporary source path /var/folders/79/mjy6k9xs6l74_cf_zjg8klgc0000gn/T/vertx4695595712845187618ceylon for /Users/julien/java/mod-lang-ceylon/src/examples/ceylon/examples/httphelloworld/HelloWorldServer.ceylon
    Compiled module app878754/1.0.0
    Succeeded in deploying verticle

### from a Ceylon module containing a Verticle

This mode compiles and runs an entire Vert.x module written in Ceylon:

From the previous example, create a directory named `httpserververticle` and move the `HelloWorldServer.ceylon`
in this folder.

Add a module descriptor `module.ceylon`:

    module httpserververticle "1.0.0" {
      shared import "io.vertx.ceylon" "1.0.0";
    }

Add package descriptor `package.ceylon`::

    shared package httpserververticle;

Now at the root of the module source we run the Ceylon module file:

    % vertx run httpserververticle/module.ceylon
    Compiled module httpserververticle/1.0.0
    Succeeded in deploying verticle

### A precompiled Verticle

In the previous examples, Vert.x was compiling the module for you, `mod-lang-ceylon` can also run compiled modules
from your Ceylon repository. This means you have compiled this module with the `ceylon compile` command or Ceylon IDE
and installed it in your user repository `$HOME/.ceylon`:

    vertx run ceylon:httpserververticle/1.0.0
    Succeeded in deploying verticle

### Specifying the main Verticle

A failure will occur when a module contains several verticle instances, because there is an ambiguity about the
 Verticle to use. A Verticle can deploy other Verticles, so it is valid to have several Verticle, in such situation
 the `io.vertx.ceylon.platform.main` annotation can be used to specify the _main_ verticle of this module:

    import io.vertx.ceylon.platform { main }

    main(`class MainVerticle`)
    module myapp "1.0.0" {
      shared import "io.vertx.ceylon.platform" "1.0.0";
    }

### Deployment options

When running a module, options can be specified, mod-lang-ceylon defines two configuration options:

- `systemRepo`: provide an explicit system repository and overrides the default system repository contained in mod-lang-ceylon
- `userRepo`: provide an explicit user repository where Ceylon stores compiled modules or look for existing modules, when
such repository does not exist, mod-lang-ceylon will create a temporary repository
- `verbose`: activate Ceylon verbose option, useful for debugging
- `mainVerticle`: specify a Verticle to deploy, usually used when you deploy a module that could contain several verticles. This
will override any `main` annotation

## Creating a module

A module is a Ceylon verticle packaged in a zip file with a `mod.json` descriptor at the root of the zip. Usually
a module packages the various libraries required by the module in a `lib` directory. Ceylon has its own module system
and works best with it, therefore for Ceylon only the `mod.json` file is required and its `main` entry should contain the
name of the Ceylon module prefixed by `ceylon`, like the precompiled Verticle seen before.

    {
       "main": "ceylon:httpserververticle/1.0.0"
    }

Then you can run it:

    % vertx runmod my~httpserververticle~1.0.0

This module will be resolved in the default module repository of the platform. The `userRepo` configuration can be
 used for resolving the module from this location instead, note this is specified at run time:

    % echo '{ "userRepo":"/modules" }' > conf.json
    % vertx runmod my~httpserververticle~1.0.0 -conf conf.json
# Writing Verticles

As was described in the [main manual](http://vertx.io/manual.html#verticle), a verticle is the execution unit of Vert.x.

To recap, Vert.x is a container which executes packages of code called Verticles, and it ensures that the code in the verticle is never executed concurrently by more than one thread. You can write your verticles in any of the languages that Vert.x supports, and Vert.x supports running many verticle instances concurrently in the same Vert.x instance.

All the code you write in a Vert.x application runs inside a Verticle instance.

For simple prototyping and trivial tasks you can write raw verticles and run them directly on the command line, but in most cases you will always wrap your verticles inside Vert.x modules.

For now, let's try writing a simple raw verticle.

As an example we'll write a simple TCP echo server. The server just accepts connections and any data received by it is echoed back on the connection.

Copy the following into a text editor and save it as `Server.ceylon` 

    import io.vertx.ceylon.platform { Verticle, Container }
    import io.vertx.ceylon.core { Vertx }
    import io.vertx.ceylon.core.net { NetSocket }
    import io.vertx.ceylon.core.stream { Pump }
    
    shared class Server() extends Verticle() {
      shared void start(Vertx vertx, Container container) {
        vertx.createNetServer().connectHandler(void (NetSocket sock) {
          Pump(sock.readStream, sock.writeStream).start();
        }).listen(1234);
      }
    }

Now run it:

    vertx run Server.ceylon

The server will now be running. Connect to it using telnet:

    telnet localhost 1234

And notice how data you send (and hit enter) is echoed back to you.

Congratulations! You've written your first verticle.

Notice how you didn't have to first compile the `.ceylon` file to a module. Vert.x understands how to run .ceylon files directly - internally doing the compilation on the fly. (It also supports running modulesw too if you prefer)

Every Ceylon verticle must extend the class [`Verticle`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Verticle.type.html). You must override the start method - this is called by Vert.x when the verticle is started.

__In the rest of this manual we'll assume the code snippets are running inside a verticle.__
## Asynchronous start

In some cases your Verticle has to do some other stuff asynchronously in its [`Verticle.start`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Verticle.type.html#start) method, e.g. start other verticles, and the verticle shouldn't be considered started until those other actions are complete.

If this is the case for your verticle you can implement the asynchronous version [`Verticle.asyncStart`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Verticle.type.html#asyncStart) method:

    shared actual Promise<Anything> asyncStart(Vertx vertx, Container container) {
      return container.deployVerticle("foo.js");
    }
## Verticle clean-up

Servers, clients, event bus handlers and timers will be automatically closed / cancelled when the verticle is stopped. However, if you have any other clean-up logic that you want to execute when the verticle is stopped, you can implement a [`Verticle.stop`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Verticle.type.html#stop) method which will be called when the verticle is undeployed.
## The container object

When the verticle starts it gets a [`Container`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html) instance. This represents the Verticle's view of the container in which it is running.

The container object contains methods for deploying and undeploying verticle and modules, and also allows config, environment variables and a logger to be accessed.
## The vertx object

When the verticle starts it gets a the [`Vertx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html) object. This provides access to the Vert.x core API. You'll use the Core API to do most things in Vert.x including TCP, HTTP, file system access, event bus, timers etc.
## Getting Configuration in a Verticle

You can pass configuration to a module or verticle from the command line using the `-conf option, for example:

    vertx runmod com.mycompany~my-mod~1.0 -conf myconf.json

or for a raw verticle

    vertx run foo.js -conf myconf.json

The argument to `-conf` is the name of a text file containing a valid JSON object.

That configuration is available inside your verticle by calling the [`Container.config`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#config) method on the container member variable of the verticle:

    value config = container.config;
    
    print("Config is ``config``");

The config returned is an instance of [`Object`](https://modules.ceylon-lang.org/repo/1/ceylon/json/1.1.0/module-doc/api/Object.type.html), which is a class which represents JSON objects (unsurprisingly!). You can use this object to configure the verticle.

Allowing verticles to be configured in a consistent way like this allows configuration to be easily passed to them irrespective of the language that deploys the verticle.
## Logging from a Verticle

Each verticle is given its own logger. To get a reference to it use the [`Container.logger`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#logger) object on the container instance:

    value logger = container.logger;
    
    logger.info("I am logging something");

The logger is an instance of the interface [`Logger`](https://modules.ceylon-lang.org/repo/1/ceylon/logging/1.1.0/module-doc/api/Logger.type.html) and has the following methods:

* [`Logger.trace`](https://modules.ceylon-lang.org/repo/1/ceylon/logging/1.1.0/module-doc/api/Logger.type.html#trace)
* [`Logger.debug`](https://modules.ceylon-lang.org/repo/1/ceylon/logging/1.1.0/module-doc/api/Logger.type.html#debug)
* [`Logger.info`](https://modules.ceylon-lang.org/repo/1/ceylon/logging/1.1.0/module-doc/api/Logger.type.html#info)
* [`Logger.warn`](https://modules.ceylon-lang.org/repo/1/ceylon/logging/1.1.0/module-doc/api/Logger.type.html#warn)
* [`Logger.error`](https://modules.ceylon-lang.org/repo/1/ceylon/logging/1.1.0/module-doc/api/Logger.type.html#error)
* [`Logger.fatal`](https://modules.ceylon-lang.org/repo/1/ceylon/logging/1.1.0/module-doc/api/Logger.type.html#fatal)

Which have the normal meanings you would expect.

The log files by default go in a file called `vertx.log in the system temp directory. On my Linux box this is \tmp.

For more information on configuring logging, please see the [main manual](http://vertx.io/manual.html#logging).
## Accessing environment variables from a Verticle

You can access the map of environment variables from a Verticle with the [`Container.env`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#env) object on the `container` object.
## Causing the container to exit

You can call the [`Container.exit`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#exit) method of the container to cause the Vert.x instance to make a clean shutdown.
# Deploying and Undeploying Verticles Programmatically

You can deploy and undeploy verticles programmatically from inside another verticle. Any verticles deployed this way will be able to see resources (classes, scripts, other files) of the main verticle.
## Deploying a simple verticle

To deploy a verticle programmatically call the function [`Container.deployVerticle`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#deployVerticle) on the container.

To deploy a single instance of a verticle :

    container.deployVerticle(main);

Where `main` is the name of the Verticle (i.e. the name of the Java file or FQCN of the class).

See the chapter on ["running Vert.x"](http://vertx.io/manual.html#running-vertx) in the main manual for a description of what a main is.
## Deploying Worker Verticles

The [`Container.deployVerticle`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#deployVerticle) method deploys standard (non worker) verticles. If you want to deploy worker verticles use the [`Container.deployWorkerVerticle`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#deployWorkerVerticle) method. This method takes the same parameters as [`Container.deployVerticle`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#deployVerticle) with the same meanings.
## Deploying a module programmatically

You should use [`Container.deployModule`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#deployModule) to deploy a module, for example:

    container.deployModule("io.vertx~mod-mailer~2.0.0-beta1", config);

Would deploy an instance of the `io.vertx~mod-mailer~2.0.0-beta1` module with the specified configuration. Please see the modules manual for more information about modules.
## Passing configuration to a verticle programmatically

JSON configuration can be passed to a verticle that is deployed programmatically. Inside the deployed verticle the configuration is accessed with the [`Container.config`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#config) attribute. For example:

    value config = Object {
      "foo"->"wibble",
      "bar"->false
    };
    container.deployVerticle("foo.ChildVerticle", config);

Then, in `ChildVerticle` you can access the config via [`Container.config`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#config) as previously explained.
## Using a Verticle to co-ordinate loading of an application

If you have an appplication that is composed of multiple verticles that all need to be started at application start-up, then you can use another verticle that maintains the application configuration and starts all the other verticles. You can think of this as your application starter verticle.

For example, you could create a verticle AppStarter as follows:

    // Application config
    
    JsonObject appConfig = container.config();
    
    value verticle1Config = appConfig["verticle1_conf"];
    value verticle2Config = appConfig["verticle2_conf"];
    value verticle3Config = appConfig["verticle3_conf"];
    value verticle4Config = appConfig["verticle4_conf"];
    value verticle5Config = appConfig["verticle5_conf"];
    
    // Start the verticles that make up the app
    
    container.deployVerticle("verticle1.js", verticle1Config);
    container.deployVerticle("verticle2.rb", verticle2Config);
    container.deployVerticle("foo.Verticle3", verticle3Config);
    container.deployWorkerVerticle("foo.Verticle4", verticle4Config);
    container.deployWorkerVerticle("verticle5.js", verticle5Config, 10);

Then create a file 'config.json" with the actual JSON config in it

    {
       "verticle1_conf": {
           "foo": "wibble"
       },
       "verticle2_conf": {
           "age": 1234,
           "shoe_size": 12,
           "pi": 3.14159
       },
       "verticle3_conf": {
           "strange": true
       },
       "verticle4_conf": {
           "name": "george"
       },
       "verticle5_conf": {
           "tel_no": "123123123"
       }
    }

Then set the `AppStarter` as the main of your module and then you can start your entire application by simply running:

    vertx runmod com.mycompany~my-mod~1.0 -conf config.json

If your application is large and actually composed of multiple modules rather than verticles you can use the same technique.

More commonly you'd probably choose to write your starter verticle in a scripting language such as JavaScript, Groovy, Ruby or Python - these languages have much better JSON support than Java, so you can maintain the whole JSON config nicely in the starter verticle itself.
## Specifying number of instances

By default, when you deploy a verticle only one instance of the verticle is deployed. Verticles instances are strictly single threaded so this means you will use at most one core on your server.

Vert.x scales by deploying many verticle instances concurrently.

If you want more than one instance of a particular verticle or module to be deployed, you can specify the number of instances as follows:

    container.deployVerticle("foo.ChildVerticle", null, 10);

or

    container.deployModule("io.vertx~some-mod~1.0", null, 10);

The above examples would deploy 10 instances.
## Getting Notified when Deployment is complete

The actual verticle deployment is asynchronous and might not complete until some time after the call to [`Container.deployVerticle`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#deployVerticle) or [`Container.deployVerticle`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#deployVerticle) has returned. If you want to be notified when the verticle has completed being deployed, you can use the [`Promise`](https://modules.ceylon-lang.org/repo/1/ceylon/promise/1.1.0/module-doc/api/Promise.type.html) returned by [`Container.deployVerticle`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#deployVerticle) or [`Container.deployModule`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#deployModule):

    Promise<String> deployment = container.deployVerticle("foo.ChildVerticle");
    deployment.onComplete(
      (String deploymentID) => print("The verticle has been deployed, deployment ID is ``deploymentID``"),
      (Throwable failure) => failure.printStackTrace()
    );

The promise is resolved with the `deploymentID`, you will need this if you need to subsequently undeploy the verticle / module.
## Undeploying a Verticle or Module

Any verticles or modules that you deploy programmatically from within a verticle, and all of their children are automatically undeployed when the parent verticle is undeployed, so in many cases you will not need to undeploy a verticle manually, however if you do need to do this, it can be done by calling the method [`Container.undeployVerticle`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#undeployVerticle) or [`Container.undeployModule`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/platform/1.0.0/module-doc/api/Container.type.html#undeployModule) passing in the deployment id.

    container.undeployVerticle(deploymentID);

You can use the returned promise if you want to be informed when undeployment is complete.
## Scaling your application

A verticle instance is almost always single threaded (the only exception is multi-threaded worker verticles which are an advanced feature), this means a single instance can at most utilise one core of your server.

In order to scale across cores you need to deploy more verticle instances. The exact numbers depend on your application - how many verticles there are and of what type.

You can deploy more verticle instances programmatically or on the command line when deploying your module using the -instances command line option.
# The Event Bus

## The Event Bus

The event bus is the nervous system of Vert.x.

It allows verticles to communicate with each other irrespective of what language they are written in, and whether they're in the same Vert.x instance, or in a different Vert.x instance.

It even allows client side JavaScript running in a browser to communicate on the same event bus. (More on that later).

The event bus forms a distributed peer-to-peer messaging system spanning multiple server nodes and multiple browsers.

The event bus API is incredibly simple. It basically involves registering handlers, unregistering handlers and sending and publishing messages.

First some theory: 
## The Theory
### Addressing

Messages are sent on the event bus to an address.

Vert.x doesn't bother with any fancy addressing schemes. In Vert.x an address is simply a string, any string is valid. However it is wise to use some kind of scheme, e.g. using periods to demarcate a namespace.

Some examples of valid addresses are `europe.news.feed1`, `acme.games.pacman`, `sausages`, and `X`. 
### Handlers

A handler is a thing that receives messages from the bus. You register a handler at an address.

Many different handlers from the same or different verticles can be registered at the same address. A single handler can be registered by the verticle at many different addresses.
### Publish / subscribe messaging

The event bus supports __publishing__ messages. Messages are published to an address. Publishing means delivering the message to all handlers that are registered at that address. This is the familiar __publish/subscribe__ messaging pattern.
### Point to point and Request-Response messaging

The event bus supports __point to point__ messaging. Messages are sent to an address. Vert.x will then route it to just one of the handlers registered at that address. If there is more than one handler registered at the address, one will be chosen using a non-strict round-robin algorithm.

With point to point messaging, an optional reply handler can be specified when sending the message. When a message is received by a recipient, and has been handled, the recipient can optionally decide to reply to the message. If they do so that reply handler will be called.

When the reply is received back at the sender, it too can be replied to. This can be repeated ad-infinitum, and allows a dialog to be set-up between two different verticles. This is a common messaging pattern called the Request-Response pattern.
### Transient

__All messages in the event bus are transient, and in case of failure of all or parts of the event bus, there is a possibility messages will be lost. If your application cares about lost messages, you should code your handlers to be idempotent, and your senders to retry after recovery.__

If you want to persist your messages you can use a persistent work queue module for that.
### Types of messages

Messages that you send on the event bus can be as simple as a string, a number or a boolean. You can also send Vert.x buffers or JSON messages.

It's highly recommended you use JSON messages to communicate between verticles. JSON is easy to create and parse in all the languages that Vert.x supports.
## Event Bus API

Let's jump into the API.
### Registering and Unregistering Handlers

To set a message handler on the address `test.address`, you do something like the following:

    value eb = vertx.eventBus();
    function myHandler(Message message) => print("I received a message ``message.body``");
    eb.registerHandler("test.address", myHandler);

It's as simple as that. The handler will then receive any messages sent to that address.

The class [`Message`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/eventbus/Message.type.html) is a generic type and specific Message types include:

* `Message<String>` : mapped to [`String`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/String.type.html)
* `Message<Boolean>` : mapped to [`Boolean`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/Boolean.type.html)
* `Message<byte[]>` : mapped to [ByteArray](http://docs.oracle.com/javase/7/docs/api/java/lang/ByteArray.html) virtual type
* `Message<Double>` : mapped to [`Float`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/Float.type.html)
* `Message<JsonObject>` : mapped to [`Object`](https://modules.ceylon-lang.org/repo/1/ceylon/json/1.1.0/module-doc/api/Object.type.html)
* `Message<JsonArray>` : mapped to [`Array`](https://modules.ceylon-lang.org/repo/1/ceylon/json/1.1.0/module-doc/api/Array.type.html)
* `Message<Long>` : mapped to Ceylon [`Integer`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/Integer.type.html)
* `Message<Buffer>` : mapped to [Buffer](http://vertx.io/api/java/org/vertx/java/core/buffer/Buffer.html)
* `Message<Byte>` : mapped to [`Byte`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/Byte.type.html) or [`Integer`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/Integer.type.html)
* `Message<Character>` : mapped to [`Character`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/Character.type.html)
* `Message<Float>` : mapped to [`Float`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/Float.type.html)
* `Message<Integer>` : mapped to [`Integer`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/Integer.type.html)
* `Message<Short>` : mapped to [`Integer`](https://modules.ceylon-lang.org/repo/1/ceylon/language/1.1.0/module-doc/api/Integer.type.html)

If you know you'll always be receiving messages of a particular type you can use the specific type in your handler, e.g:

    void myHandler(Message<String> message) {
       String body = message.body;
    }

You can create also combine types:

    void myHandler(Message<String|Integer> message) {
       ...
    }

The return value of [`EventBus.registerHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/eventbus/EventBus.type.html#registerHandler) is a [`Registration`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Registration.type.html) object that allows to unregister an handler:

    value registration = eb.registerHandler("test.address", myHandler);
    registration.cancel();

When you register a handler on an address and you're in a cluster it can take some time for the knowledge of that new handler to be propagated across the entire cluster. If you want to be notified you can use the [`Registration.completed`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Registration.type.html#completed) `Promise` object. This promise will then be resolved once the information has reached all nodes of the cluster.

    value registration = eb.registerHandler("test.address", myHandler);
    registration.completed.onComplete(
     (Anything anything) => print("The handler has been registered across the cluster",
     (Throwable failure) => print("The handler has not been registered across the cluster: ``failure.message`"
    );

If you want your handler to live for the full lifetime of your verticle there is no need to unregister it explicitly - Vert.x will automatically unregister any handlers when the verticle is stopped.
### Publishing messages

Publishing a message is also trivially easy. Just publish it specifying the address, for example:

    eb.publish("test.address", "hello world");

That message will then be delivered to all handlers registered against the address `test.address`.
### Sending messages

Sending a message will result in only one handler registered at the address receiving the message. This is the point to point messaging pattern. The handler is chosen in a non strict round-robin fashion.

    eb.send("test.address", "hello world");
### Replying to messages

Sometimes after you send a message you want to receive a reply from the recipient. This is known as the __request-response__ pattern.

To do this you send a message, and specify a specify a return type that you expected: the various methods for sending messages return a `Promise<Message<M>>` that is resolved when the reply is received, when no type is not specified it falls down to `Nothing`. When the receiver receives the message they can reply to it by calling the reply method on the message. When this method is invoked it causes a reply to be sent back to the sender where the reply Promise is resolved. An example will make this clear:

The receiver:

    void myHandler(Message<String> message) {
      print("I received a message ``message.body``");
    
      // Do some stuff
      
      // Now reply to it
      message.reply("This is a reply");
    }

The sender:

    value reply = eb.send<String>("test.address", "This is a message");
    reply.onComplete((Message<String> message) => println("I received a reply ``message.body``"));

It is legal also to send an empty reply or a null reply.

The replies themselves can also be replied to so you can create a dialog between two different verticles consisting of multiple rounds.
#### Specifying timeouts for replies

__Not yet in 2.0__
#### Getting notified of reply failures

__Not yet in 2.0__
### Message types

The message you send can be any of the following types:

* `boolean`
* `byte[]`
* `double`
* `long`
* `java.lang.String`
* `org.vertx.java.core.json.JsonObject`
* `org.vertx.java.core.json.JsonArray`
* `short`
* `float`
* `integer`
* `org.vertx.java.core.buffer.Buffer`
* `byte`
* `character`

Vert.x buffers and JSON objects and arrays are copied before delivery if they are delivered in the same JVM, so different verticles can't access the exact same object instance which could lead to race conditions.

Here are some more examples:

Send some numbers:

    eb.send("test.address", 1234);
    eb.send("test.address", 3.14159);

Send a boolean:

    eb.send("test.address", true);

Send a JSON object:

    value obj = Object { "foo"->"wibble" };
    eb.send("test.address", obj);

Null messages can also be sent:

    eb.send("test.address", null);

It's a good convention to have your verticles communicating using JSON - this is because JSON is easy to generate and parse for all the languages that Vert.x supports.
## Distributed event bus

To make each Vert.x instance on your network participate on the same event bus, start each Vert.x instance with the -cluster command line switch.

See the chapter in the main manual on [running Vert.x](http://vertx.io/core_manual_java.html) for more information on this.

Once you've done that, any Vert.x instances started in cluster mode will merge to form a distributed event bus.

# Shared Data

## Shared Data

Sometimes it makes sense to allow different verticles instances to share data in a safe way. Vert.x allows simple [`SharedMap`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/shareddata/SharedMap.type.html) (like a [ConcurrentMap](http://docs.oracle.com/javase/7/docs/api/java/util/concurrent/ConcurrentMap.html) and [`SharedSet`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/shareddata/SharedSet.type.html) data structures to be shared between verticles.

There is a caveat: To prevent issues due to mutable data, Vert.x only allows simple immutable types such as number, boolean and string or Buffer to be used in shared data. With a Buffer, it is automatically copied when retrieved from the shared data, so different verticle instances never see the same object instance.

Currently data can only be shared between verticles in the same Vert.x instance. In later versions of Vert.x we aim to extend this to allow data to be shared by all Vert.x instances in the cluster.
### Shared Maps

To use a shared map to share data between verticles first we get a reference to the map, and then use it like any other instance of [`SharedMap`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/shareddata/SharedMap.type.html)

    SharedMap<String, Integer> map = vertx.sharedData.getMap("demo.mymap");
    
    map.put("some-key", 123);

And then, in a different verticle you can access it:

    SharedMap<String, Integer> map = vertx.sharedData.getMap("demo.mymap");
    
    // etc
### Shared Sets

To use a shared set to share data between verticles first we get a reference to the set.

    SharedSet<String> set = vertx.sharedData.getSet("demo.myset");
    
    set.add("some-value");

And then, in a different verticle:

    SharedSet<String> set = vertx.sharedData.getSet("demo.myset");
    
    // etc

# Buffers

Most data in Vert.x is shuffled around using instances of [Buffer](http://vertx.io/api/java/org/vertx/java/core/buffer/Buffer.html). We chose deliberately to use the Vert.x native type as it can easily used from Ceylon and a wrapper would complicate the bridge.

A Buffer represents a sequence of zero or more bytes that can be written to or read from, and which expands automatically as necessary to accomodate any bytes written to it. You can perhaps think of a buffer as smart byte array.
## Creating Buffers

Create a new empty buffer:

    value buff = Buffer();

Create a buffer from a String. The String will be encoded in the buffer using UTF-8.

    value buff = Buffer("some-string");

Create a buffer from a String: The String will be encoded using the specified encoding, e.g:

    value buff = Buffer("some-string", "UTF-16");

Create a buffer from a byte[] (using [ByteArray](http://docs.oracle.com/javase/7/docs/api/java/lang/ByteArray.html))

    ByteArray bytes = ...;
    value buff = Buffer(bytes);   

Create a buffer with an initial size hint. If you know your buffer will have a certain amount of data written to it you can create the buffer and specify this size. This makes the buffer initially allocate that much memory and is more efficient than the buffer automatically resizing multiple times as data is written to it.

Note that buffers created this way are empty. It does not create a buffer filled with zeros up to the specified size.

    value buff = Buffer(10000);
## Writing to a Buffer

There are two ways to write to a buffer: appending, and random access. In either case buffers will always expand automatically to encompass the bytes. It's not possible to get an `IndexOutOfBoundsException` with a buffer.
### Appending to a Buffer

To append to a buffer, you use the `appendXXX` methods. Append methods exist for appending other buffers, byte[], String and all primitive types.

The return value of the appendXXX methods is the buffer itself, so these can be chained:

    value buff = Buffer();
    
    buff.appendInt(123).appendString("hello\n");
### Random access buffer writes

You can also write into the buffer at a specific index, by using the `setXXX` methods. Set methods exist for other buffers, byte[], String and all primitive types. All the set methods take an index as the first argument - this represents the position in the buffer where to start writing the data.

    value buff = Buffer();
    
    buff.setInt(1000, 123);
    buff.setString(0, "hello");
## Reading from a Buffer

Data is read from a buffer using the `getXXX` methods. Get methods exist for byte[], String and all primitive types. The first argument to these methods is an index in the buffer from where to get the data.

    Buffer buff = ...;
    Integer i = buff.getInt(0);
## Other buffer methods:

* length(). To obtain the length of the buffer. The length of a buffer is the index of the byte in the buffer with the largest index + 1.
* copy(). Copy the entire buffer
# JSON

Whereas JavaScript has first class support for JSON, and Ruby has Hash literals which make representing JSON easy within code, things aren't so easy in Ceylon

A JSON object is represented by instances of [`Object`](https://modules.ceylon-lang.org/repo/1/ceylon/json/1.1.0/module-doc/api/Object.type.html). A JSON array is represented by instances of [`Array`](https://modules.ceylon-lang.org/repo/1/ceylon/json/1.1.0/module-doc/api/Array.type.html).

A usage example would be using a Ceylon verticle to send or receive JSON messages from the event bus.

    value eb = vertx.eventBus();
    
    value obj = Object { "foo"->"wibble", "age"->1000 };
    eb.send("some-address", obj);
    
    // ....
    // And in a handler somewhere:
    
    shared void handle(Message<Object> message) {
      print("foo is ``message.body["foo"]``");
      print("age is ``message.body["age"]``");
    }
# Delayed and Periodic Tasks

It's very common in Vert.x to want to perform an action after a delay, or periodically.

In standard verticles you can't just make the thread sleep to introduce a delay, as that will block the event loop thread.

Instead you use Vert.x timers. Timers can be __one-shot__ or __periodic__. We'll discuss both
## One-shot Timers

A one shot timer calls an event handler after a certain delay, expressed in milliseconds.

To set a timer to fire once you use the [`Vertx.setTimer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html#setTimer) method passing in the delay and a handler

    value timerId = vertx.setTimer(1000, (Integer timerId) => print("And one second later this is printed"));
    
    print("First this is printed");

The return value is a unique timer id which can later be used to cancel the timer. The handler is also passed the timer id.
## Periodic Timers

You can also set a timer to fire periodically by using the [`Vertx.setPeriodic`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html#setPeriodic) method. There will be an initial delay equal to the period. The return value of [`Vertx.setPeriodic`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html#setPeriodic) is a unique timer id (long). This can be later used if the timer needs to be cancelled. The argument passed into the timer event handler is also the unique timer id:

    value timerId = vertx.setTimer(1000, (Integer timerId) => print("And every second this is printed"));
    
    print("First this is printed");
## Cancelling timers

To cancel a periodic timer, call the [`Vertx.cancelTimer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html#cancelTimer) method specifying the timer id. For example:

    value timerId = vertx.setTimer(1000, (Integer timerId) => print("Should not be printed"));
    
    // And immediately cancel it
    
    vertx.cancelTimer(timerID);

Or you can cancel it from inside the event handler. The following example cancels the timer after it has fired 10 times.

    variable Integer count = 0;
    vertx.setTimer {
      delay = 1000;
      void handle(Integer timerId) {
        print("In event handler ``count``");
        if (++count == 10) {
          vertx.cancelTimer(timerId);
        }
      }
    };
# Writing TCP Servers and Clients

## Writing TCP Servers and Clients

Creating TCP servers and clients is very easy with Vert.x.
### Net Server
#### Creating a Net Server

To create a TCP server you call the [`Vertx.createNetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html#createNetServer) method on your vertx instance.

    value server = vertx.createNetServer();
#### Start the Server Listening

To tell that server to listen for connections we do:

    value server = vertx.createNetServer();
    
    server.listen(1234, "myhost");

The first parameter to [`NetServer.listen`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html#listen) is the port. A wildcard port of `0` can be specified which means a random available port will be chosen to actually listen at. Once the server has completed listening you can then call the [`NetServer.port`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html#port) attribute of the server to find out the real port it is using.

The second parameter is the hostname or ip address. If it is omitted it will default to `0.0.0.0` which means it will listen at all available interfaces.

The actual bind is asynchronous so the server might not actually be listening until some time after the call to listen has returned. If you want to be notified when the server is actually listening you can use the returned promise. For example:

    value result = server.listen(1234);
    value.onComplete {
      void onFulfilled(NetServer server) {
        print(""Listen succeeded");
      },
      void onRejected(Throwable reason) {
        print(""Listen failed");
      }
    };
#### Getting Notified of Incoming Connections

To be notified when a connection occurs we need to call the [`NetServer.connectHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html#connectHandler) method of the server, passing in a handler. The handler will then be called when a connection is made:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        print("A client has connected!");
      }
    };
    
    server.listen(1234, "localhost");

That's a bit more interesting. Now it displays 'A client has connected!' every time a client connects.

The return value of the [`NetServer.connectHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html#connectHandler) method is the server itself, so multiple invocations can be chained together. That means we can rewrite the above as:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        print("A client has connected!");
      }
    }.listen(1234, "localhost");

or 

    vertx.createNetServer().connectHandler {
      void onConnect(NetSocket sock) {
        print("A client has connected!");
      }
    }.listen(1234, "localhost");

This is a common pattern throughout the Vert.x API.
#### Closing a Net Server

To close a net server just call the [`NetServer.close`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html#close) function.

    server.close();

he close is actually asynchronous and might not complete until some time after the [`NetServer.close`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html#close) method has returned. If you want to be notified when the actual close has completed then you can use the returned promise.

This promise will then be fulfilled when the close has fully completed.

    server.close().onComplete {
      void onFulfilled(Anything anything) {
        print("Close succeeded");
      },
      void onRejected(Throwable reason) {
        print("Close failed");
      }
    };

If you want your net server to last the entire lifetime of your verticle, you don't need to call [`NetServer.close`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html#close) explicitly, the Vert.x container will automatically close any servers that you created when the verticle is undeployed.
#### NetServer Properties

NetServer has a set of properties you can set which affect its behaviour. Firstly there are bunch of properties used to tweak the TCP parameters, in most cases you won't need to set these:

* [`ServerBase.tcpNoDelay`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/ServerBase.type.html#tcpNoDelay) If true then [Nagle's Algorithm](http://en.wikipedia.org/wiki/Nagle's_algorithm) is disabled. If false then it is enabled.
* [`NetworkBase.sendBufferSize`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/NetworkBase.type.html#sendBufferSize) Sets the TCP send buffer size in bytes.
* [`NetworkBase.receiveBufferSize`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/NetworkBase.type.html#receiveBufferSize) Sets the TCP receive buffer size in bytes.
* [`ServerBase.tcpKeepAlive`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/ServerBase.type.html#tcpKeepAlive) if tcpKeepAlive is true then TCP keep alive is enabled, if false it is disabled.
* [`NetworkBase.reuseAddress`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/NetworkBase.type.html#reuseAddress) if reuse is true then addresses in TIME_WAIT state can be reused after they have been closed.
* [`ServerBase.soLinger`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/ServerBase.type.html#soLinger)
* [`NetworkBase.trafficClass`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/NetworkBase.type.html#trafficClass)

[`NetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html) has a further set of properties which are used to configure SSL. We'll discuss those later on.
#### Handling Data

So far we have seen how to create a NetServer, and accept incoming connections, but not how to do anything interesting with the connections. Let's remedy that now.

When a connection is made, the [`NetServer.connectHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html#connectHandler) is called passing in an instance of [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html). This is a socket-like interface to the actual connection, and allows you to read and write data as well as do various other things like close the socket.
##### Reading Data from the Socket

To read data from the socket you need to set the [`ReadStream.dataHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html#dataHandler) on the [`NetSocket.readStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#readStream). This handler will be called with an instance of [Buffer](http://vertx.io/api/java/org/vertx/java/core/buffer/Buffer.html) every time data is received on the socket. You could try the following code and telnet to it to send some data:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        sock.readStream.dataHandler {
          void onData(Buffer buffer) {
            print("I received ``buffer.length()`` bytes of data"));
          }
        }
      }
    }.listen(1234, "localhost");;
##### Writing Data to a Socket

To write data to a socket, you invoke the [`NetSocket.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#write) function. This function can be invoked in a few ways:

With a single buffer:

    value myBuffer = Buffer(...);
    sock.write(myBuffer);

A string. In this case the string will encoded using UTF-8 and the result written to the wire.

    sock.write("hello");

A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.

    sock.write(["hello", "UTF-16"]);

The [`NetSocket.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#write) function is asynchronous and always returns immediately after the write has been queued. Let's put it all together.

Here's an example of a simple TCP echo server which simply writes back (echoes) everything that it receives on the socket:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        sock.readStream.dataHandler {
          void onData(Buffer buffer) {
            sock.write(buffer);
          }
        }
      }
    }.listen(1234, "localhost");;
##### Socket Remote Address

You can find out the remote address of the socket (i.e. the address of the other side of the TCP IP connection) by calling [`NetSocket.remoteAddress`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#remoteAddress).
##### Socket Local Address

You can find out the local address of the socket (i.e. the address of this side of the TCP IP connection) by calling [`NetSocket.localAddress`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#localAddress).
##### Closing a socket

You can close a socket by invoking the [`NetSocket.close`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#close) method. This will close the underlying TCP connection.
##### Closed Handler

If you want to be notified when a socket is closed, you can use the [`NetSocket.closeHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#closeHandler) promise:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        sock.closeHandler.onComplete {
          void onFulfilled(Anything anything) {
            print("The socket is now closed");
          }
        }
      }
    }.listen(1234, "localhost");;

The closed handler will be called irrespective of whether the close was initiated by the client or server.
##### Exception handler

You can set an exception handler on the socket that will be called if an exception occurs asynchronously on the connection:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        sock.readStream.exceptionHandler {
          void onException(Throwable cause) {
            print("Oops, something went wrong");
            t.printStackTrace();
          }
        }
      }
    }.listen(1234, "localhost");;
##### Event Bus Write Handler

Every NetSocket automatically registers a handler on the event bus, and when any buffers are received in this handler, it writes them to itself. This enables you to write data to a NetSocket which is potentially in a completely different verticle or even in a different Vert.x instance by sending the buffer to the address of that handler.

The address of the handler is given by the [`NetSocket.writeHandlerID`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#writeHandlerID) attribute.

For example to write some data to the NetSocket from a completely different verticle you could do:

    String writeHandlerID = ... // E.g. retrieve the ID from shared data
    
    vertx.eventBus().send(writeHandlerID, buffer);
##### Read and Write Streams

NetSocket provide access to [`NetSocket.readStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#readStream) and [`NetSocket.writeStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html#writeStream). This allows flow control to occur on the connection and the connection data to be pumped to and from other object such as HTTP requests and responses, WebSockets and asynchronous files.

This will be discussed in depth in the chapter on streams and pumps.
#### Scaling TCP Servers

A verticle instance is strictly single threaded.

If you create a simple TCP server and deploy a single instance of it then all the handlers for that server are always executed on the same event loop (thread).

This means that if you are running on a server with a lot of cores, and you only have this one instance deployed then you will have at most one core utilised on your server!

To remedy this you can simply deploy more instances of the module in the server, e.g.

    vertx runmod com.mycompany~my-mod~1.0 -instances 20

Or for a raw verticle

    vertx run foo.MyApp -instances 20

The above would run 20 instances of the module/verticle in the same Vert.x instance.

Once you do this you will find the echo server works functionally identically to before, but, as if by magic, all your cores on your server can be utilised and more work can be handled.

At this point you might be asking yourself '_Hold on, how can you have more than one server listening on the same host and port? Surely you will get port conflicts as soon as you try and deploy more than one instance?_'

Vert.x does a little magic here.

When you deploy another server on the same host and port as an existing server it doesn't actually try and create a new server listening on the same host/port.

Instead it internally maintains just a single server, and, as incoming connections arrive it distributes them in a round-robin fashion to any of the connect handlers set by the verticles.

Consequently Vert.x TCP servers can scale over available cores while each Vert.x verticle instance remains strictly single threaded, and you don't have to do any special tricks like writing load-balancers in order to scale your server on your multi-core machine.
### Net Client

A NetClient is used to make TCP connections to servers.
#### Creating a Net Client

To create a TCP client you call the [`Vertx.createNetClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html#createNetClient) method on your vertx instance.

    value Netclient = vertx.createNetClient();
#### Making a Connection

To actually connect to a server you invoke the [`NetClient.connect`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html#connect) method:

    value Netclient = vertx.createNetClient();
    
    Promise<NetSocket> connect = client.connect(1234, "localhost");
    connect.onComplete {
      void onFulfilled(NetSocket socket) {
        print(""We have connected! Socket is ``socket``");
      },
      void onRejected(Throwable reason) {
        reason.printStackTrace();
      }
    };

The connect method takes the port number as the first parameter, followed by the hostname or ip address of the server. The third parameter is a connect handler. This handler will be called when the connection actually occurs.

The argument returned by [`NetClient.connect`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html#connect) is a `Promise<NetSocket>` fulfilled with the [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html). You can read and write data from the socket in exactly the same way as you do on the server side.

You can also close it, set the closed handler, set the exception handler and use it as a `ReadStream` or `WriteStream` exactly the same as the server side [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html).
#### Configuring Reconnection

A NetClient can be configured to automatically retry connecting or reconnecting to the server in the event that it cannot connect or has lost its connection. This is done by setting the [`NetClient.reconnectAttempts`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html#reconnectAttempts) and [`NetClient.reconnectInterval`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html#reconnectInterval) attributes:

    value client = vertx.createNetClient();
    client.reconnectAttempts = 1000;
    client.reconnectInterval = 500;

`reconnectAttempts` determines how many times the client will try to connect to the server before giving up  A value of `-1` represents an infinite number of times. The default value is `0`. I.e. no reconnection is attempted.

`reconnectInterval` detemines how long, in milliseconds, the client will wait between reconnect attempts. The default value is `1000`.
#### NetClient Properties

Just like [`NetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html), [`NetClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html) also has a set of TCP properties you can set which affect its behaviour. They have the same meaning as those on [`NetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html).

[`NetClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html) also has a further set of properties which are used to configure SSL. We'll discuss those later on.
### SSL Servers

Net servers can also be configured to work with [Transport Layer Security](http://en.wikipedia.org/wiki/Transport_Layer_Security) (previously known as SSL).

When a [`NetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html) is working as an SSL Server the API of the [`NetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html) and [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html) is identical compared to when it working with standard sockets. Getting the server to use SSL is just a matter of configuring the [`NetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html) before [`NetServer.listen`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html#listen) is called.

To enabled SSL the attribute [`ServerBase.ssl`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/ServerBase.type.html#ssl) must be called on the Net Server.

The server must also be configured with a __key store__ and an optional __trust store__.

These are both __Java keystores__ which can be managed using the [keytool](http://docs.oracle.com/javase/6/docs/technotes/tools/solaris/keytool.html) utility which ships with the JDK.

The keytool command allows you to create keystores, and import and export certificates from them.

The key store should contain the server certificate. This is mandatory - the client will not be able to connect to the server over SSL if the server does not have a certificate.

The key store is configured on the server using the [`NetworkBase.keyStorePath`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/NetworkBase.type.html#keyStorePath) and [`NetworkBase.keyStorePassword`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/NetworkBase.type.html#keyStorePassword) methods.

The trust store is optional and contains the certificates of any clients it should trust. This is only used if client authentication is required.

To configure a server to use server certificates only:

    value server = vertx.createNetServer();
    server.ssl = true;
    server.keyStorePath = "/path/to/your/keystore/server-keystore.jks";
    server.keyStorePassword = "password";

Making sure that `server-keystore.jks` contains the server certificate.

To configure a server to also require client certificates:

    value server = vertx.createNetServer();
    server.ssl = true;
    server.keyStorePath = "/path/to/your/keystore/server-keystore.jks";
    server.keyStorePassword = "password";
    server.trustStorePath = "/path/to/your/keystore/server-truststore.jks";
    server.trustStorePassword = "password";
    server.clientAuthRequired = true;

Making sure that `server-truststore.jks` contains the certificates of any clients who the server trusts.

If `clientAuthRequired` is set to `true and the client cannot provide a certificate, or it provides a certificate that the server does not trust then the connection attempt will not succeed.
### SSL Clients

Net Clients can also be easily configured to use SSL. They have the exact same API when using SSL as when using standard sockets.

To enable SSL on a [`NetClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html) the attribute [`NetworkBase.ssl`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/NetworkBase.type.html#ssl) is set to `true`.

If the [`ClientBase.trustAll`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/ClientBase.type.html#trustAll) is invoked on the client, then the client will trust all server certificates. The connection will still be encrypted but this mode is vulnerable to 'man in the middle' ttacks. I.e. you can't be sure who you are connecting to. Use this with caution. Default value is `false`.

If [`ClientBase.trustAll`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/ClientBase.type.html#trustAll) has not been set to `true` then a client trust store must be configured and should contain the certificates of the servers that the client trusts.

The client trust store is just a standard Java key store, the same as the key stores on the server side. The client trust store location is set by using the attribute [`NetworkBase.trustStorePath`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/NetworkBase.type.html#trustStorePath) on the [`NetClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html). If a server presents a certificate during connection which is not in the client trust store, the connection attempt will not succeed.

If the server requires client authentication then the client must present its own certificate to the server when connecting. This certificate should reside in the client key store. Again it's just a regular Java key store. The client keystore location is set by using the [`NetworkBase.keyStorePath`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/NetworkBase.type.html#keyStorePath) attribute on the [`NetClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html).

To configure a client to trust all server certificates (dangerous):

    value client = vertx.createNetClient();
    client.ssl = true;
    client.trustAll = true;

To configure a client to only trust those certificates it has in its trust store:

    value client = vertx.createNetClient();
    client.ssl = true;
    client.trustStorePath = "/path/to/your/client/truststore/client-truststore.jks";
    client.trustStorePassword = "password";

To configure a client to only trust those certificates it has in its trust store, and also to supply a client certificate:

    value client = vertx.createNetClient();
    client.ssl = true;
    client.trustStorePath = "/path/to/your/client/truststore/client-truststore.jks";
    client.trustStorePassword = "password";
    client.clientAuthRequired = true;
    client.keyStorePath = "/path/to/keystore/holding/client/cert/client-keystore.jks";
    client.keyStorePassword = "password";

# Flow Control - Streams and Pumps

## Flow Control - Streams and Pumps

There are several objects in Vert.x that allow data to be read from and written to in the form of Buffers.

In Vert.x, calls to write data return immediately and writes are internally queued.

It's not hard to see that if you write to an object faster than it can actually write the data to its underlying resource then the write queue could grow without bound - eventually resulting in exhausting available memory.

To solve this problem a simple flow control capability is provided by some objects in the Vert.x API.

Any flow control aware object that can be written-to provides a [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html), and any flow control object that can be read-from is said to provides a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html).

Let's take an example where we want to read from a `ReadStream` and write the data to a `WriteStream`.

A very simple example would be reading from a [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html) on a server and writing back to the same [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html) - since [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html) provides both [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html), but you can do this between any [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and any [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html), including HTTP requests and response, async files, WebSockets, etc.

A naive way to do this would be to directly take the data that's been read and immediately write it to the NetSocket, for example:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        sock.dataHandler {
          void onData(Buffer buffer) {
            // Write the data straight back
            sock.write(buffer);
          }
        }
      }
    }.listen(1234, "localhost");

There's a problem with the above example: If data is read from the socket faster than it can be written back to the socket, it will build up in the write queue of the [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html), eventually running out of RAM. This might happen, for example if the client at the other end of the socket wasn't reading very fast, effectively putting back-pressure on the connection.

Since NetSocket provides [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html), we can check if the [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) is full before writing to it:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        sock.dataHandler {
          void onData(Buffer buffer) {
            if (!sock.writeStream) {
              sock.write(buffer);
            }
          }
        }
      }
    }.listen(1234, "localhost");

This example won't run out of RAM but we'll end up losing data if the write queue gets full. What we really want to do is pause the [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html) when the write queue is full. Let's do that:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        sock.dataHandler {
          void onData(Buffer buffer) {
            if (!sock.writeStream) {
              sock.write(buffer);
            } else {
              sock.writeStream.pause();
          }
        }
      }
    }.listen(1234, "localhost");

We're almost there, but not quite. The `NetSocket` now gets paused when the file is full, but we also need to unpause it when the write queue has processed its backlog:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        sock.dataHandler {
          void onData(Buffer buffer) {
            if (!sock.writeStream) {
              sock.write(buffer);
            } else {
              sock.readStream.pause();
              sock.writeStream.drainHandler {
                void onDrain() {
                  sock.readStream.resume();
                }
              };
            }
          }
        }
      }
    }.listen(1234, "localhost");

And there we have it. The [`WriteStream.drainHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#drainHandler) event handler will get called when the write queue is ready to accept more data, this resumes the NetSocket which allows it to read more data.

It's very common to want to do this when writing Vert.x applications, so we provide a helper class called [`Pump`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/Pump.type.html) which does all this hard work for you. You just feed it the [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and the [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) and it tell it to start:

    value server = vertx.createNetServer();
    
    server.connectHandler {
      void onConnect(NetSocket sock) {
        Pump(sock, sock).start();
      }
    }.listen(1234, "localhost");

Which does exactly the same thing as the more verbose example.

Let's look at the methods on [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) in more detail:
### ReadStream

[`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) is provided by `HttpClientResponse`, `HttpServerRequest`, `WebSocket`, `NetSocket`, `SockJSSocket` and `AsyncFile`.

* [`ReadStream.dataHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html#dataHandler) set a handler which will receive data from the `ReadStream`. As data arrives the handler will be passed a Buffer.
* [`ReadStream.pause`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html#pause) pause the handler. When paused no data will be received in the `dataHandler`.
* [`ReadStream.resume`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html#resume) resume the handler. The handler will be called if any data arrives.
* [`ReadStream.exceptionHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html#exceptionHandler) Will be called if an exception occurs on the `ReadStream`.
* [`ReadStream.endHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html#endHandler) Will be called when end of stream is reached. This might be when EOF is reached if the `ReadStream`  represents a file, or when end of request is reached if it's an HTTP request, or when the connection is closed if it's a TCP socket.
### WriteStream

[`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) is provided by , `HttpClientRequest`, `HttpServerResponse`, `WebSocket`, `NetSocket`, `SockJSSocket` and `AsyncFile`.

* [`WriteStream.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#write) write a Buffer to the `WriteStream`. This method will never block. Writes are queued internally and asynchronously written to the underlying resource.
* [`WriteStream.setWriteQueueMaxSize`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#setWriteQueueMaxSize) set the number of bytes at which the write queue is considered __full__, and the method `writeQueueFull()` returns `true`. Note that, even if the write queue is considered full, if `write is called the data will still be accepted and queued.
* [`WriteStream.writeQueueFull`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#writeQueueFull) returns `true` if the write queue is considered full.
* [`WriteStream.exceptionHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#exceptionHandler) Will be called if an exception occurs on the `WriteStream`.
* [`WriteStream.drainHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#drainHandler) The handler will be called if the `WriteStream` is considered no longer full.
### Pump

Instances of Pump have the following methods:

* [`Pump.start`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/Pump.type.html#start) Start the pump.
* [`Pump.stop`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/Pump.type.html#stop) Stops the pump. When the pump starts it is in stopped mode.
* [`Pump.setWriteQueueMaxSize`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/Pump.type.html#setWriteQueueMaxSize) This has the same meaning as [`WriteStream.setWriteQueueMaxSize`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#setWriteQueueMaxSize).
* [`Pump.bytesPumped`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/Pump.type.html#bytesPumped) Returns total number of bytes pumped.

A pump can be started and stopped multiple times.

When a pump is first created it is __not__ started. You need to call the [`Pump.start`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/Pump.type.html#start) method to start it.

# Writing HTTP Servers and Clients

## Writing HTTP Servers and Clients
### Writing HTTP servers

Vert.x allows you to easily write full featured, highly performant and scalable HTTP servers.
#### Creating an HTTP Server

To create an HTTP server you call the `createHttpServer` method on your `vertx` instance.

    HttpServer server = vertx.createHttpServer();
#### Start the Server Listening

To tell that server to listen for incoming requests you use the listen method:

    HttpServer server = vertx.createHttpServer();
    server.listen(8080, "myhost");

The first parameter to listen is the `port`, The second parameter is the hostname or ip address. If it is omitted it will default to 0.0.0.0 which means it will listen at all available interfaces. Note that you could also do it this way:

    server.listen { port = 8080; hostName = "myhost"; };

The actual bind is asynchronous so the server might not actually be listening until some time after the call to listen has returned. If you want to be notified when the server is actually listening you can use the `Promise<HttpServer>` returned by the `listen` method. For example:

    server.listen(8080, "myhost").
       onComplete(
         (HttpServer server) => print("Listen succeeded"),
         (Exception e) => print("Listen failed")
       );
#### Getting Notified of Incoming Requests

To be notified when a request arrives you need to set a request handler. This is done by calling the requestHandler method of the server, passing in the handler:

    value server = vertx.createHttpServer();
    
    void handle(HttpServerRequest request) {
      print(""A request has arrived on the server!");
      request.response.end();
    }
    
    server.requestHandler(handle);
    server.listen(8080, "localhost");
#### Handling HTTP Requests

So far we have seen how to create an `HttpServer` and be notified of requests. Lets take a look at how to handle the requests and do something useful with them.

When a request arrives, the request handler is called passing in an instance of `HttpServerRequest`. This object represents the server side HTTP request.

The handler is called when the headers of the request have been fully read. If the request contains a body, that body may arrive at the server some time after the request handler has been called.

It contains functions to get the URI, path, request headers and request parameters. It also contains a `response` reference to an object that represents the server side HTTP response for the object.
##### Request Method

The request object has a `method` attribute which returns a string representing what HTTP method was requested. This attribute has the type `ceylon.net.http.Method`.
##### Request Version

The request object has a method [`HttpServerRequest.version`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#version) attribute which returns an [`HttpVersion`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpVersion.type.html)(enum) representing the HTTP version.
##### Request URI

The request object has an [`HttpServerRequest.uri`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#uri) attribute which returns the full URI (Uniform Resource Locator) of the request. For example, if the request URI was: `/a/b/c/page.html?param1=abc&param2=xyz` then it would return the corresponding `ceylon.net.uri.Uri`. Request URIs can be relative or absolute (with a domain) depending on what the client sent. In most cases they will be relative.
##### Request Path

The request object has a [`HttpServerRequest.path`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#path) attribute which returns the path of the request. For example, if the request URI was `/a/b/c/page.html?param1=abc&param2=xyz` then path would return the string `/a/b/c/page.html`
##### Request Query

The request object has a [`HttpServerRequest.query`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#query) which contains the query of the request as a `ceylon.net.uri.Query` object.
##### Request Headers

The request headers are available using the [`HttpServerRequest.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#headers) attribute on the request object. The returned object is an instance of `Map<String,{String+}>`.

Here's an example that echoes the headers to the output of the response. Run it and point your browser at http://localhost:8080 to see the headers.

    value server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      value sb = StringBuilder();
      for (header in request.headers) {
        for (val in header.item) {
          sb.append("``header.key``: ``val``");
        }
      }
      request.response.end(sb.string);
    }
    server.requestHandler(handle).listen(8080, "localhost);
##### Request params

Similarly to the headers, the request parameters are available using the [`HttpServerRequest.params`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#params) attribute on the request object. Request parameters are sent on the request URI, after the path. For example if the URI was:

    /page.html?param1=abc&param2=xyz

Then the params multimap would contain the following entries:

    param1: 'abc'
    param2: 'xyz
##### Remote Address

Use the [`HttpServerRequest.remoteAddress`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#remoteAddress) attribute to find out the address of the other side of the HTTP connection.
##### Absolute URI

Use the method [`HttpServerRequest.absoluteURI`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#absoluteURI) to return the absolute URI corresponding to the request.
##### Reading Data from the Request Body

Sometimes an HTTP request contains a request body that we want to read. As previously mentioned the request handler is called when only the headers of the request have arrived so the HttpServerRequest object does not contain the body. This is because the body may be very large and we don't want to create problems with exceeding available memory.

To receive the body, you need to call the [`HttpServerRequest.parseBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#parseBody) method on the request object with a [`BodyType`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/BodyType.type.html) implementation. This method returns a `Promise<Body>` that will be resolved when the body will be fully parsed, here's an example:

    value server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      Promise<ByteBuffer> p = request.parseBody(binaryBody);
      p.onComplete((ByteBuffer body) => print("I received ``body.size`` bytes"));
    }
    server.requestHandler(handle).listen(8080, "localhost");

There are several body type implementations:

* [`binaryBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/binaryBody.type.html) : provides a `ceylon.io.ByteBuffer` for any mime type
* [`textBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/textBody.type.html) : provides a Ceylon string for mime type `text/*`
* [`jsonBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/jsonBody.type.html) : provides a `ceylon.json.Object` for mime type `application/json`

It is of course possible to implement custom [`BodyType`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/BodyType.type.html), for instance here is the implementation for text content:

    shared object textBody satisfies BodyType<String> {
      shared actual Boolean accept(String mimeType) => mimeType.startsWith("text/");
        shared actual String parse(Charset? charset, Buffer data) {
          if (exists charset) {
            return data.toString(charset.name);
          } else {
            return data.string;
          }
       }
    }

Note that this API is different from the original Vert.x API. Also this current implementation will parse the full body before calling the body type object, in the future this will likely evolve to provide a finer granularity for body parsing.
##### Handling Multipart Form Uploads

Vert.x understands file uploads submitted from HTML forms in browsers. In order to handle file uploads you should set the [`HttpServerRequest.uploadHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#uploadHandler) on the request. The handler will be called once for each upload in the form.

    request.expectMultiPart(true);
    
    request.uploadHandler {
      void onUpload(HttpServerFileUpload upload) {
      }
    });

The [`HttpServerFileUpload`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerFileUpload.type.html) class implements [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) so you read the data and stream it to any object that implements [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) using a Pump, as previously discussed.

You can also stream it directly to disk using the convenience method [`HttpServerFileUpload.streamToFileSystem`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerFileUpload.type.html#streamToFileSystem).

    request.expectMultiPart(true);
    
    request.uploadHandler {
      void onUpload(HttpServerFileUpload upload) {
        upload.streamToFileSystem("uploads/``upload.filename()``");
      }
    });
##### Handling Multipart Form Attributes

If the request corresponds to an HTML form that was submitted you can use the [`HttpServerRequest.formAttributes`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#formAttributes) promise to access the form attributes. This promise is resolved after all of the request has been read - this is because form attributes are encoded in the request body not in the request headers.

    req.formAttributes.onComplete((Map<String, {String+}> formAttributes) => print("Do something with them"));

When the request does not have form attributes the `formAttributes` promise is rejected.
#### HTTP Server Responses

As previously mentioned, the HTTP request object contains a [`HttpServerRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#response) attribute. This returns the HTTP response for the request. You use it to write the response back to the client.
##### Setting Status Code and Message

To set the HTTP status code for the response use the [`HttpServerResponse.status`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#status) method, e.g.

    HttpServer server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      request.response.status {
        code = 739;
        message = "Too many gerbils";
      }.end();
    }
    server.requestHandler(handle).listen(8080, "localhost");

You can also set the status message. If you do not set the status message a default message will be used.

The default value for the status code is `200`.
###### Writing HTTP responses

To write data to an HTTP response, you invoke the write function. This function can be invoked multiple times before the response is ended. It can be invoked in a few ways:

With a single buffer:

    Buffer myBuffer = ...
    request.response.write(myBuffer);

A string. In this case the string will encoded using UTF-8 and the result written to the wire.

    request.response.write("hello");

A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.

    request.response.write(["hello", "UTF-16"]);

The [`HttpServerResponse.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#write) function is asynchronous and always returns immediately after the write has been queued. If you are just writing a single string or Buffer to the HTTP response you can write it and end the response in a single call to the [`HttpServerResponse.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#end) method.

The first call to [`HttpServerResponse.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#write) results in the response header being being written to the response.

Consequently, if you are not using HTTP chunking then you must set the `Content-Length` header before writing to the response, since it will be too late otherwise. If you are using HTTP chunking you do not have to worry.
###### Ending HTTP responses

Once you have finished with the HTTP response you must call the [`HttpServerResponse.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#end) function on it.

This function can be invoked in several ways:

With no arguments, the response is simply ended.

    request.response.end();

The function can also be called with a string or Buffer in the same way [`HttpServerResponse.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#write) is called. In this case it's just the same as calling write with a string or Buffer followed by calling [`HttpServerResponse.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#end) with no arguments. For example:

    request.response.end("That's all folks");
###### Closing the underlying connection

You can close the underlying TCP connection of the request by calling the [`HttpServerResponse.close`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#close) method.

    request.response.close();
###### Response headers

HTTP response headers can be added to the response by passing them to the [`HttpServerResponse.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#headers) methods:

    request.response.headers { "Cheese"->"Stilton", "Hat colour"->"Mauve" };

Response headers must all be added before any parts of the response body are written.
###### Chunked HTTP Responses and Trailers

Vert.x supports [HTTP Chunked Transfer Encoding](http://en.wikipedia.org/wiki/Chunked_transfer_encoding). This allows the HTTP response body to be written in chunks, and is normally used when a large response body is being streamed to a client, whose size is not known in advance.

You put the HTTP response into chunked mode as follows:

    req.response.setChunked(true);

Default is non-chunked. When in chunked mode, each call to `response.write(...)` will result in a new HTTP chunk being written out.

When in chunked mode you can also write HTTP response trailers to the response. These are actually written in the final chunk of the response.

To add trailers to the response, add them to the multimap returned from the trailers() method:

    request.response.trailers {
      "Philosophy"->"Solipsism",
      "Favourite-Shakin-Stevens-Song"->"Behind the Green Door"
    };
##### Serving files directly from disk

Not yet implemented.
##### Pumping Responses

The [`HttpServerResponse.stream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#stream) provides a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) you can pump to it from any [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html), e.g. an [`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html), [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html), [`WebSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/WebSocket.type.html) or [`HttpServerRequest`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html).

Here's an example which echoes HttpRequest headers and body back in the HttpResponse. It uses a pump for the body, so it will work even if the HTTP request body is much larger than can fit in memory at any one time:

    HttpServer server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      HttpServerResponse resp = req.response;
      resp.headers(req.headers);
      req.stream.pump(resp.stream).start();
      req.stream.endHandler(resp.close);
    }
    server.requestHandler(handle).listen(8080, "localhost");
##### HTTP Compression

Vert.x comes with support for HTTP Compression out of the box. Which means you are able to automatically compress the body of the responses before they are sent back to the Client. If the client does not support HTTP Compression the responses are sent back without compressing the body. This allows to handle Client that support HTTP Compression and those that not support it at the same time.

To enable compression you only need to do:

    HttpServer server = vertx.createHttpServer();
    server.compressionSupported = true;

The default is false.

When HTTP Compression is enabled the [`HttpServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServer.type.html) will check if the client did include an 'Accept-Encoding' header which includes the supported compressions. Common used are deflate and gzip. Both are supported by Vert.x. Once such a header is found the [`HttpServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServer.type.html) will automatically compress the body of the response with one of the supported compressions and send it back to the client.

Be aware that compression may be able to reduce network traffic but is more cpu-intensive.
#### Writing HTTP Clients
##### Creating an HTTP Client

To create an HTTP client you call the [`Vertx.createHttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html#createHttpClient) method on your vertx instance:

    HttpClient client = vertx.createHttpClient();

You set the port and hostname (or ip address) that the client will connect to using the [`HttpClient.host`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#host) and [`HttpClient.port`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#port) attributes:

    HttpClient client = vertx.createHttpClient();
    client.port = 8181;
    client.host = "foo.com";

You can also set the port and host when creating the client:

    HttpClient client = vertx.createHttpClient {
      port = 8181;
      host = "foo.com";
    };

A single [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) always connects to the same host and port. If you want to connect to different servers, create more instances.

The default port is `80` and the default host is `localhost`. So if you don't explicitly set these values that's what the client will attempt to connect to.
##### Pooling and Keep Alive

By default the [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) pools HTTP connections. As you make requests a connection is borrowed from the pool and returned when the HTTP response has ended.

If you do not want connections to be pooled you can set [`HttpClient.keepAlive`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#keepAlive) to false:

    HttpClient client = vertx.createHttpClient();
    client.port = 8181;
    client.host = "foo.com";
    client.keepAlive = false;

In this case a new connection will be created for each HTTP request and closed once the response has ended.

You can set the maximum number of connections that the client will pool as follows:

    HttpClient client = vertx.createHttpClient();
    client.port = 8181;
    client.host = "foo.com";
    client.maxPoolSize = 10;

The default value is `1`.
##### Closing the client

Any HTTP clients created in a verticle are automatically closed for you when the verticle is stopped, however if you want to close it explicitly you can:

    client.close();
##### Making Requests

To make a request using the client you invoke one the methods named after the HTTP method that you want to invoke.

For example, to make a `POST` request:

    value client = vertx.createHttpClient{ host = "foo.com" };
    HttpClientRequest request = client.post("/some-path"/);
    request.response.onComplete((HttpClientResponse resp) => print("Got a response: ``resp.status``"));
    request.end();

To make a PUT request use the [`HttpClient.put`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#put) method, to make a GET request use the [`HttpClient.get`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#get) method, etc.

Legal request methods are: [`HttpClient.get`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#get), [`HttpClient.put`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#put), [`HttpClient.post`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#post), [`HttpClient.delete`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#delete), [`HttpClient.head`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#head), [`HttpClient.options`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#options), [`HttpClient.connect`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#connect), [`HttpClient.trace`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#trace) and [`HttpClient.patch`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#patch).

The general modus operandi is you invoke the appropriate method passing in the request URI. The `Promise<HttpClientResponse` [`HttpClientRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#response)] attribute will be resolved when the corresponding response arrives. Note that the response promise should be used before the [`HttpClientRequest.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#end) method is called, so the promise will be resolved by the Vert.x thread.

The value specified in the request URI corresponds to the Request-URI as specified in [Section 5.1.2 of the HTTP specification](http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html). __In most cases it will be a relative URI__.

__Please note that the domain/port that the client connects to is determined by [`HttpClient.port`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#port) and [`HttpClient.host`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#host), and is not parsed from the uri.__

The return value from the appropriate request method is an instance of [`HttpClientRequest`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html). You can use this to add headers to the request, and to write to the request body. The request object implements [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html).

Once you have finished with the request you must call the [`HttpClientRequest.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#end) method.

If you don't know the name of the request method in advance there is a general [`HttpClient.request`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#request) method which takes the HTTP method as a parameter:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete((HttpClientResponse resp) => print("Got a response: ``resp.status``"));
    request.end();
###### Handling exceptions

The [`HttpClientRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#response) promise will be rejected when the request fails.
###### Writing to the request body

Writing to the client request body has a very similar API to writing to the server response body.

To write data to an [`HttpClientRequest`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html) object, you invoke the [`HttpClientRequest.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#write) function. This function can be called multiple times before the request has ended. It can be invoked in a few ways:

With a single buffer:

    Buffer myBuffer = Buffer(...);
    sock.write(myBuffer);

A string. In this case the string will encoded using UTF-8 and the result written to the wire:

    request.write("hello");

A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.

    request.write("hello", "UTF-16");

The [`HttpClientRequest.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#write) function is asynchronous and always returns immediately after the write has been queued. The actual write might complete some time later.

If you are just writing a single string or Buffer to the HTTP request you can write it and end the request in a single call to the end function.

The first call to `write` will result in the request headers being written to the request. Consequently, if you are not using HTTP chunking then you must set the `Content-Length` header before writing to the request, since it will be too late otherwise. If you are using HTTP chunking you do not have to worry.
###### Ending HTTP requests

Once you have finished with the HTTP request you must call the [`HttpClientRequest.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#end) function on it.

This function can be invoked in several ways:

With no arguments, the request is simply ended.

    request.end();

The function can also be called with a string or Buffer in the same way `write` is called. In this case it's just the same as calling write with a string or Buffer followed by calling `end` with no arguments.
###### Writing Request Headers

To write headers to the request, add them using the [`HttpClientRequest.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#headers) method:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete((HttpClientResponse resp) => print("Got a response: ``resp.status``"));
    request.headers { "Some-Header"->"Some-Value" };
    request.end();
###### Request timeouts

You can set a timeout for specific Http Request using the [`HttpClientRequest.timeout`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#timeout) attribute. If the request does not return any data within the timeout period the [`HttpClientRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#response) will be rejected and the request will be closed.
###### HTTP chunked requests

Vert.x supports [HTTP Chunked Transfer Encoding](http://en.wikipedia.org/wiki/Chunked_transfer_encoding) for requests. This allows the HTTP request body to be written in chunks, and is normally used when a large request body is being streamed to the server, whose size is not known in advance.

You put the HTTP request into chunked mode as follows:

    request.chunked = true;

Default is non-chunked. When in chunked mode, each call to request.write(...) will result in a new HTTP chunk being written out.
##### HTTP Client Responses

Client responses are received as an argument to the response handler that is passed into one of the request methods on the HTTP client.

The response object provides a [`HttpClientResponse.stream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#stream) attribute, so it can be pumped to a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) like any other [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html).

To query the status code of the response use the [`HttpClientResponse.statusMessage`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#statusMessage) attribute. The [`HttpClientResponse.statusMessage`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#statusMessage) attribute contains the status message. For example:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete {
      void onFulfilled(HttpClientResponse resp) {
        print("server returned status code: ``resp.statusCode``");
        print("server returned status message: ``resp.statusMessage``");
      }
    };
    request.end();
###### Reading Data from the Response Body

The API for reading an HTTP client response body is very similar to the API for reading a HTTP server request body.

Sometimes an HTTP response contains a body that we want to read. Like an HTTP request, the client response promise is resolved when all the response headers have arrived, not when the entire response body has arrived.

To receive the response body, you use the [`HttpClientResponse.parseBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#parseBody) on the response object which returns a `Promise<Body>` that is resolved when the response body has been parsed. Here's an example:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete((HttpClientResponse resp) => resp.parseBody(binaryBody).onComplete((ByteBuffer body) => print("I received  + ``body.size`` + bytes")));
    request.end();

The response object provides the [`HttpClientResponse.stream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#stream) interface so you can pump the response body to a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html). See the chapter on streams and pump for a detailed explanation.
###### Reading cookies

You can read the list of cookies from the response using the [`HttpClientResponse.cookies`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#cookies) attribute.
##### 100-Continue Handling

todo
##### HTTP Compression

Vert.x comes with support for HTTP Compression out of the box. Which means the HTTPClient can let the remote Http server know that it supports compression, and so will be able to handle compressed response bodies. A Http server is free to either compress with one of the supported compression algorithm or send the body back without compress it at all. So this is only a hint for the Http server which it may ignore at all.

To tell the Http server which compression is supported by the [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) it will include a 'Accept-Encoding' header with the supported compression algorithm as value. Multiple compression algorithms are supported. In case of Vert.x this will result in have the following header added:

    Accept-Encoding: gzip, deflate

The Http Server will choose then from one of these. You can detect if a HttpServer did compress the body by checking for the 'Content-Encoding' header in the response sent back from it.

If the body of the response was compressed via gzip it will include for example the following header:

    Content-Encoding: gzip

To enable compression you only need to do:

    HttpClient client = vertx.createHttpClient();
    client.tryUserCompression = true;

The default is false.
#### Pumping Requests and Responses

The HTTP client and server requests and responses all implement either [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) or [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html). This means you can pump between them and any other read and write streams.
#### HTTPS Servers

HTTPS servers are very easy to write using Vert.x.

An HTTPS server has an identical API to a standard HTTP server. Getting the server to use HTTPS is just a matter of configuring the HTTP Server before listen is called.

Configuration of an HTTPS server is done in exactly the same way as configuring a [`NetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html) for SSL. Please see SSL server chapter for detailed instructions.
#### HTTPS Clients

HTTPS clients can also be very easily written with Vert.x

Configuring an HTTP client for HTTPS is done in exactly the same way as configuring a [`NetClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html) for SSL. Please see SSL client chapter for detailed instructions.
#### Scaling HTTP servers

Scaling an HTTP or HTTPS server over multiple cores is as simple as deploying more instances of the verticle. For example:

    vertx runmod com.mycompany~my-mod~1.0 -instance 20

Or, for a raw verticle:

    vertx run foo.MyServer -instances 20

The scaling works in the same way as scaling a NetServer. Please see the chapter on scaling Net Servers for a detailed explanation of how this works.
### Routing HTTP requests with Pattern Matching

Vert.x lets you route HTTP requests to different handlers based on pattern matching on the request path. It also enables you to extract values from the path and use them as parameters in the request.

This is particularly useful when developing REST-style web applications.

To do this you simply create an instance of [`RouteMatcher`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html) and use it as handler in an HTTP server. See the chapter on HTTP servers for more information on setting HTTP handlers. Here's an example:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    server.requestHandler(routeMatcher.handle).listen { port = 8080; host = "localhost"; };
#### Specifying matches.

You can then add different matches to the route matcher. For example, to send all GET requests with path `/animals/dogs` to one handler and all GET requests with path `/animals/cats` to another handler you would do:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    routerMarcher.get("/animals/dogs", (HttpServerRequest req) => req.response().end("You requested dogs"));
    routerMarcher.get("/animals/cats", (HttpServerRequest req) => req.response().end("You requested cats"));
    server.requestHandler(router.handle).listen { port = 8080; host = "localhost"; };

Corresponding methods exist for each HTTP method - `get`, `post`, `put`, `delete`, `head`, `options`, `trace`, `connect` and `patch`.

There's also an `all` method which applies the match to any HTTP request method.

The handler specified to the method is just a normal HTTP server request handler, the same as you would supply to the requestHandler method of the HTTP server.

You can provide as many matches as you like and they are evaluated in the order you added them, the first matching one will receive the request.

A request is sent to at most one handler.
#### Extracting parameters from the path

If you want to extract parameters from the path, you can do this too, by using the : (colon) character to denote the name of a parameter. For example:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    routerMarcher.get {
      pattern = "/:blogname/:post";
      void handler(HttpServerRequest req) {
        assert(exists blogName = req.params["blogname"]);
        assert(exists post = req.params["post"]);
        req.response.end("blogname is ``blogName`` post is ``post``");
      }
    };
    server.requestHandler(router.handle).listen { port = 8080; host = "localhost"; };

Any params extracted by pattern matching are added to the map of request parameters.

In the above example, a PUT request to `/myblog/post1 would result in the variable`blogName`getting the value`myblog`and the
variable`post`getting the value`post1`.

Valid parameter names must start with a letter of the alphabet and be followed by any letters of the alphabet or digits or the underscore character.
#### Extracting params using Regular Expressions

Regular Expressions can be used to extract more complex matches. In this case capture groups are used to capture any parameters.

Since the capture groups are not named they are added to the request with names `param0`, `param1`, `param2`, etc.

Corresponding methods exist for each HTTP method - [`RouteMatcher.getWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#getWithRegEx), [`RouteMatcher.postWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#postWithRegEx), [`RouteMatcher.putWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#putWithRegEx), [`RouteMatcher.deleteWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#deleteWithRegEx), [`RouteMatcher.headWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#headWithRegEx), [`RouteMatcher.optionsWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#optionsWithRegEx), [`RouteMatcher.traceWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#traceWithRegEx), [`RouteMatcher.connectWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#connectWithRegEx) and [`RouteMatcher.patchWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#patchWithRegEx).

There's also an [`RouteMatcher.allWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#allWithRegEx) method which applies the match to any HTTP request method.

For example:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    routerMarcher.get {
      pattern = "\\/([^\\/]+)\\/([^\\/]+)";
      void handler(HttpServerRequest req) {
        assert(exists first = req.params["param0"]);
        assert(exists second = req.params["param1"]);
        req.response.end("first is ``first`` and second is ``second``");
      }
    };
    server.requestHandler(router.handle).listen { port = 8080; host = "localhost"; };

Run the above and point your browser at `http://localhost:8080/animals/cats`.
#### Handling requests where nothing matches

You can use the [`RouteMatcher.noMatch`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#noMatch) method to specify a handler that will be called if nothing matches. If you don't specify a no match handler and nothing matches, a 404 will be returned.

    routeMatcher.noMatch((HttpServerRequest req) => req.response.end("Nothing matched"));
#### WebSockets

[WebSockets](http://en.wikipedia.org/wiki/WebSocket) are a web technology that allows a full duplex socket-like connection between HTTP servers and HTTP clients (typically browsers).
##### WebSockets on the server

To use WebSockets on the server you create an HTTP server as normal, but instead of setting a `requestHandler` you set a `websocketHandler` on the server.

    value server = vertx.createHttpServer();
    
    server.websocketHandler {
      void handle(ServerWebSocket ws) {
        // A WebSocket has connected!
      }
    }.listen(8080, "localhost");
###### Reading from and Writing to WebSockets

The `websocket` instance passed into the handler provides access to the [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html), so you can read and write data to it in the normal ways. I.e by setting a [`ReadStream.dataHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html#dataHandler) and calling the [`WriteStream.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#write) method.

See the chapter on streams and pumps for more information.

For example, to echo all data received on a WebSocket:

    value server = vertx.createHttpServer();
    
    server.websocketHandler {
      void handle(ServerWebSocket ws) {
        value pump = ws.readStream.pump(ws.writeStream);
        pump.start();
     }
    }.listen(8080, "localhost");

The `websocket instance also has method`writeBinaryFrame`for writing binary data. This has the same effect
as calling`write`.

Another method `writeTextFrame` also exists for writing text data. This is equivalent to calling

    websocket.write(Buffer("some-string"));
###### Rejecting WebSockets

Sometimes you may only want to accept WebSockets which connect at a specific path.

To check the path, you can query the [`ServerWebSocket.path`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/ServerWebSocket.type.html#path) attribute of the websocket. You can then call the [`ServerWebSocket.reject`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/ServerWebSocket.type.html#reject) method to reject the websocket.

    value server = vertx.createHttpServer();
    
    server.websocketHandler { 
      void handle(ServerWebSocket ws) {
        if (ws.path().equals("/services/echo")) {
          value pump = ws.readStream.pump(ws.writeStream);
          pump.start();
        } else {
          ws.reject();
        }
      }
    }.listen(8080, "localhost");
###### Headers on the websocket

You can use the [`ServerWebSocket.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/ServerWebSocket.type.html#headers) method to retrieve the headers passed in the Http Request from the client that caused the upgrade to websockets.
##### WebSockets on the HTTP client

To use WebSockets from the HTTP client, you create the HTTP client as normal, then call the [`HttpClient.connectWebsocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#connectWebsocket) function, passing in the URI that you wish to connect to at the server, and a handler.

The handler will then get called if the WebSocket successfully connects. If the WebSocket does not connect - perhaps the server rejects it - then any exception handler on the HTTP client will be called.

Here's an example of WebSocket connection:

    value client = vertx.createHttpClient();
    client.host = "foo.com";
    
    client.connectWebsocket("/some-uri", (WebSocket ws) => print("Connected!) });

Note that the host (and port) is set on the [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) instance, and the uri passed in the connect is __typically__ a relative URI.

Again, the client side WebSocket implements [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html), so you can read and write to it in the same way as any other stream object.
##### WebSockets in the browser

To use WebSockets from a compliant browser, you use the standard WebSocket API. Here's some example client side JavaScript which uses a WebSocket.

    <script>
    
      var socket = new WebSocket("ws://foo.com/services/echo");
    
      socket.onmessage = function(event) {
        alert("Received data from websocket: " + event.data);
      }
    
      socket.onopen = function(event) {
        alert("Web Socket opened");
        socket.send("Hello World");
      };
    
      socket.onclose = function(event) {
        alert("Web Socket closed");
      };
    
    </script>

For more information see the [WebSocket API documentation](http://dev.w3.org/html5/websockets/)

# Routing HTTP requests with Pattern Matching

## Writing HTTP Servers and Clients
### Writing HTTP servers

Vert.x allows you to easily write full featured, highly performant and scalable HTTP servers.
#### Creating an HTTP Server

To create an HTTP server you call the `createHttpServer` method on your `vertx` instance.

    HttpServer server = vertx.createHttpServer();
#### Start the Server Listening

To tell that server to listen for incoming requests you use the listen method:

    HttpServer server = vertx.createHttpServer();
    server.listen(8080, "myhost");

The first parameter to listen is the `port`, The second parameter is the hostname or ip address. If it is omitted it will default to 0.0.0.0 which means it will listen at all available interfaces. Note that you could also do it this way:

    server.listen { port = 8080; hostName = "myhost"; };

The actual bind is asynchronous so the server might not actually be listening until some time after the call to listen has returned. If you want to be notified when the server is actually listening you can use the `Promise<HttpServer>` returned by the `listen` method. For example:

    server.listen(8080, "myhost").
       onComplete(
         (HttpServer server) => print("Listen succeeded"),
         (Exception e) => print("Listen failed")
       );
#### Getting Notified of Incoming Requests

To be notified when a request arrives you need to set a request handler. This is done by calling the requestHandler method of the server, passing in the handler:

    value server = vertx.createHttpServer();
    
    void handle(HttpServerRequest request) {
      print(""A request has arrived on the server!");
      request.response.end();
    }
    
    server.requestHandler(handle);
    server.listen(8080, "localhost");
#### Handling HTTP Requests

So far we have seen how to create an `HttpServer` and be notified of requests. Lets take a look at how to handle the requests and do something useful with them.

When a request arrives, the request handler is called passing in an instance of `HttpServerRequest`. This object represents the server side HTTP request.

The handler is called when the headers of the request have been fully read. If the request contains a body, that body may arrive at the server some time after the request handler has been called.

It contains functions to get the URI, path, request headers and request parameters. It also contains a `response` reference to an object that represents the server side HTTP response for the object.
##### Request Method

The request object has a `method` attribute which returns a string representing what HTTP method was requested. This attribute has the type `ceylon.net.http.Method`.
##### Request Version

The request object has a method [`HttpServerRequest.version`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#version) attribute which returns an [`HttpVersion`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpVersion.type.html)(enum) representing the HTTP version.
##### Request URI

The request object has an [`HttpServerRequest.uri`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#uri) attribute which returns the full URI (Uniform Resource Locator) of the request. For example, if the request URI was: `/a/b/c/page.html?param1=abc&param2=xyz` then it would return the corresponding `ceylon.net.uri.Uri`. Request URIs can be relative or absolute (with a domain) depending on what the client sent. In most cases they will be relative.
##### Request Path

The request object has a [`HttpServerRequest.path`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#path) attribute which returns the path of the request. For example, if the request URI was `/a/b/c/page.html?param1=abc&param2=xyz` then path would return the string `/a/b/c/page.html`
##### Request Query

The request object has a [`HttpServerRequest.query`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#query) which contains the query of the request as a `ceylon.net.uri.Query` object.
##### Request Headers

The request headers are available using the [`HttpServerRequest.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#headers) attribute on the request object. The returned object is an instance of `Map<String,{String+}>`.

Here's an example that echoes the headers to the output of the response. Run it and point your browser at http://localhost:8080 to see the headers.

    value server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      value sb = StringBuilder();
      for (header in request.headers) {
        for (val in header.item) {
          sb.append("``header.key``: ``val``");
        }
      }
      request.response.end(sb.string);
    }
    server.requestHandler(handle).listen(8080, "localhost);
##### Request params

Similarly to the headers, the request parameters are available using the [`HttpServerRequest.params`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#params) attribute on the request object. Request parameters are sent on the request URI, after the path. For example if the URI was:

    /page.html?param1=abc&param2=xyz

Then the params multimap would contain the following entries:

    param1: 'abc'
    param2: 'xyz
##### Remote Address

Use the [`HttpServerRequest.remoteAddress`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#remoteAddress) attribute to find out the address of the other side of the HTTP connection.
##### Absolute URI

Use the method [`HttpServerRequest.absoluteURI`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#absoluteURI) to return the absolute URI corresponding to the request.
##### Reading Data from the Request Body

Sometimes an HTTP request contains a request body that we want to read. As previously mentioned the request handler is called when only the headers of the request have arrived so the HttpServerRequest object does not contain the body. This is because the body may be very large and we don't want to create problems with exceeding available memory.

To receive the body, you need to call the [`HttpServerRequest.parseBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#parseBody) method on the request object with a [`BodyType`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/BodyType.type.html) implementation. This method returns a `Promise<Body>` that will be resolved when the body will be fully parsed, here's an example:

    value server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      Promise<ByteBuffer> p = request.parseBody(binaryBody);
      p.onComplete((ByteBuffer body) => print("I received ``body.size`` bytes"));
    }
    server.requestHandler(handle).listen(8080, "localhost");

There are several body type implementations:

* [`binaryBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/binaryBody.type.html) : provides a `ceylon.io.ByteBuffer` for any mime type
* [`textBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/textBody.type.html) : provides a Ceylon string for mime type `text/*`
* [`jsonBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/jsonBody.type.html) : provides a `ceylon.json.Object` for mime type `application/json`

It is of course possible to implement custom [`BodyType`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/BodyType.type.html), for instance here is the implementation for text content:

    shared object textBody satisfies BodyType<String> {
      shared actual Boolean accept(String mimeType) => mimeType.startsWith("text/");
        shared actual String parse(Charset? charset, Buffer data) {
          if (exists charset) {
            return data.toString(charset.name);
          } else {
            return data.string;
          }
       }
    }

Note that this API is different from the original Vert.x API. Also this current implementation will parse the full body before calling the body type object, in the future this will likely evolve to provide a finer granularity for body parsing.
##### Handling Multipart Form Uploads

Vert.x understands file uploads submitted from HTML forms in browsers. In order to handle file uploads you should set the [`HttpServerRequest.uploadHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#uploadHandler) on the request. The handler will be called once for each upload in the form.

    request.expectMultiPart(true);
    
    request.uploadHandler {
      void onUpload(HttpServerFileUpload upload) {
      }
    });

The [`HttpServerFileUpload`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerFileUpload.type.html) class implements [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) so you read the data and stream it to any object that implements [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) using a Pump, as previously discussed.

You can also stream it directly to disk using the convenience method [`HttpServerFileUpload.streamToFileSystem`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerFileUpload.type.html#streamToFileSystem).

    request.expectMultiPart(true);
    
    request.uploadHandler {
      void onUpload(HttpServerFileUpload upload) {
        upload.streamToFileSystem("uploads/``upload.filename()``");
      }
    });
##### Handling Multipart Form Attributes

If the request corresponds to an HTML form that was submitted you can use the [`HttpServerRequest.formAttributes`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#formAttributes) promise to access the form attributes. This promise is resolved after all of the request has been read - this is because form attributes are encoded in the request body not in the request headers.

    req.formAttributes.onComplete((Map<String, {String+}> formAttributes) => print("Do something with them"));

When the request does not have form attributes the `formAttributes` promise is rejected.
#### HTTP Server Responses

As previously mentioned, the HTTP request object contains a [`HttpServerRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#response) attribute. This returns the HTTP response for the request. You use it to write the response back to the client.
##### Setting Status Code and Message

To set the HTTP status code for the response use the [`HttpServerResponse.status`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#status) method, e.g.

    HttpServer server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      request.response.status {
        code = 739;
        message = "Too many gerbils";
      }.end();
    }
    server.requestHandler(handle).listen(8080, "localhost");

You can also set the status message. If you do not set the status message a default message will be used.

The default value for the status code is `200`.
###### Writing HTTP responses

To write data to an HTTP response, you invoke the write function. This function can be invoked multiple times before the response is ended. It can be invoked in a few ways:

With a single buffer:

    Buffer myBuffer = ...
    request.response.write(myBuffer);

A string. In this case the string will encoded using UTF-8 and the result written to the wire.

    request.response.write("hello");

A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.

    request.response.write(["hello", "UTF-16"]);

The [`HttpServerResponse.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#write) function is asynchronous and always returns immediately after the write has been queued. If you are just writing a single string or Buffer to the HTTP response you can write it and end the response in a single call to the [`HttpServerResponse.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#end) method.

The first call to [`HttpServerResponse.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#write) results in the response header being being written to the response.

Consequently, if you are not using HTTP chunking then you must set the `Content-Length` header before writing to the response, since it will be too late otherwise. If you are using HTTP chunking you do not have to worry.
###### Ending HTTP responses

Once you have finished with the HTTP response you must call the [`HttpServerResponse.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#end) function on it.

This function can be invoked in several ways:

With no arguments, the response is simply ended.

    request.response.end();

The function can also be called with a string or Buffer in the same way [`HttpServerResponse.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#write) is called. In this case it's just the same as calling write with a string or Buffer followed by calling [`HttpServerResponse.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#end) with no arguments. For example:

    request.response.end("That's all folks");
###### Closing the underlying connection

You can close the underlying TCP connection of the request by calling the [`HttpServerResponse.close`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#close) method.

    request.response.close();
###### Response headers

HTTP response headers can be added to the response by passing them to the [`HttpServerResponse.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#headers) methods:

    request.response.headers { "Cheese"->"Stilton", "Hat colour"->"Mauve" };

Response headers must all be added before any parts of the response body are written.
###### Chunked HTTP Responses and Trailers

Vert.x supports [HTTP Chunked Transfer Encoding](http://en.wikipedia.org/wiki/Chunked_transfer_encoding). This allows the HTTP response body to be written in chunks, and is normally used when a large response body is being streamed to a client, whose size is not known in advance.

You put the HTTP response into chunked mode as follows:

    req.response.setChunked(true);

Default is non-chunked. When in chunked mode, each call to `response.write(...)` will result in a new HTTP chunk being written out.

When in chunked mode you can also write HTTP response trailers to the response. These are actually written in the final chunk of the response.

To add trailers to the response, add them to the multimap returned from the trailers() method:

    request.response.trailers {
      "Philosophy"->"Solipsism",
      "Favourite-Shakin-Stevens-Song"->"Behind the Green Door"
    };
##### Serving files directly from disk

Not yet implemented.
##### Pumping Responses

The [`HttpServerResponse.stream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#stream) provides a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) you can pump to it from any [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html), e.g. an [`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html), [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html), [`WebSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/WebSocket.type.html) or [`HttpServerRequest`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html).

Here's an example which echoes HttpRequest headers and body back in the HttpResponse. It uses a pump for the body, so it will work even if the HTTP request body is much larger than can fit in memory at any one time:

    HttpServer server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      HttpServerResponse resp = req.response;
      resp.headers(req.headers);
      req.stream.pump(resp.stream).start();
      req.stream.endHandler(resp.close);
    }
    server.requestHandler(handle).listen(8080, "localhost");
##### HTTP Compression

Vert.x comes with support for HTTP Compression out of the box. Which means you are able to automatically compress the body of the responses before they are sent back to the Client. If the client does not support HTTP Compression the responses are sent back without compressing the body. This allows to handle Client that support HTTP Compression and those that not support it at the same time.

To enable compression you only need to do:

    HttpServer server = vertx.createHttpServer();
    server.compressionSupported = true;

The default is false.

When HTTP Compression is enabled the [`HttpServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServer.type.html) will check if the client did include an 'Accept-Encoding' header which includes the supported compressions. Common used are deflate and gzip. Both are supported by Vert.x. Once such a header is found the [`HttpServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServer.type.html) will automatically compress the body of the response with one of the supported compressions and send it back to the client.

Be aware that compression may be able to reduce network traffic but is more cpu-intensive.
#### Writing HTTP Clients
##### Creating an HTTP Client

To create an HTTP client you call the [`Vertx.createHttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html#createHttpClient) method on your vertx instance:

    HttpClient client = vertx.createHttpClient();

You set the port and hostname (or ip address) that the client will connect to using the [`HttpClient.host`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#host) and [`HttpClient.port`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#port) attributes:

    HttpClient client = vertx.createHttpClient();
    client.port = 8181;
    client.host = "foo.com";

You can also set the port and host when creating the client:

    HttpClient client = vertx.createHttpClient {
      port = 8181;
      host = "foo.com";
    };

A single [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) always connects to the same host and port. If you want to connect to different servers, create more instances.

The default port is `80` and the default host is `localhost`. So if you don't explicitly set these values that's what the client will attempt to connect to.
##### Pooling and Keep Alive

By default the [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) pools HTTP connections. As you make requests a connection is borrowed from the pool and returned when the HTTP response has ended.

If you do not want connections to be pooled you can set [`HttpClient.keepAlive`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#keepAlive) to false:

    HttpClient client = vertx.createHttpClient();
    client.port = 8181;
    client.host = "foo.com";
    client.keepAlive = false;

In this case a new connection will be created for each HTTP request and closed once the response has ended.

You can set the maximum number of connections that the client will pool as follows:

    HttpClient client = vertx.createHttpClient();
    client.port = 8181;
    client.host = "foo.com";
    client.maxPoolSize = 10;

The default value is `1`.
##### Closing the client

Any HTTP clients created in a verticle are automatically closed for you when the verticle is stopped, however if you want to close it explicitly you can:

    client.close();
##### Making Requests

To make a request using the client you invoke one the methods named after the HTTP method that you want to invoke.

For example, to make a `POST` request:

    value client = vertx.createHttpClient{ host = "foo.com" };
    HttpClientRequest request = client.post("/some-path"/);
    request.response.onComplete((HttpClientResponse resp) => print("Got a response: ``resp.status``"));
    request.end();

To make a PUT request use the [`HttpClient.put`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#put) method, to make a GET request use the [`HttpClient.get`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#get) method, etc.

Legal request methods are: [`HttpClient.get`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#get), [`HttpClient.put`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#put), [`HttpClient.post`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#post), [`HttpClient.delete`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#delete), [`HttpClient.head`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#head), [`HttpClient.options`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#options), [`HttpClient.connect`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#connect), [`HttpClient.trace`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#trace) and [`HttpClient.patch`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#patch).

The general modus operandi is you invoke the appropriate method passing in the request URI. The `Promise<HttpClientResponse` [`HttpClientRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#response)] attribute will be resolved when the corresponding response arrives. Note that the response promise should be used before the [`HttpClientRequest.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#end) method is called, so the promise will be resolved by the Vert.x thread.

The value specified in the request URI corresponds to the Request-URI as specified in [Section 5.1.2 of the HTTP specification](http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html). __In most cases it will be a relative URI__.

__Please note that the domain/port that the client connects to is determined by [`HttpClient.port`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#port) and [`HttpClient.host`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#host), and is not parsed from the uri.__

The return value from the appropriate request method is an instance of [`HttpClientRequest`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html). You can use this to add headers to the request, and to write to the request body. The request object implements [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html).

Once you have finished with the request you must call the [`HttpClientRequest.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#end) method.

If you don't know the name of the request method in advance there is a general [`HttpClient.request`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#request) method which takes the HTTP method as a parameter:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete((HttpClientResponse resp) => print("Got a response: ``resp.status``"));
    request.end();
###### Handling exceptions

The [`HttpClientRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#response) promise will be rejected when the request fails.
###### Writing to the request body

Writing to the client request body has a very similar API to writing to the server response body.

To write data to an [`HttpClientRequest`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html) object, you invoke the [`HttpClientRequest.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#write) function. This function can be called multiple times before the request has ended. It can be invoked in a few ways:

With a single buffer:

    Buffer myBuffer = Buffer(...);
    sock.write(myBuffer);

A string. In this case the string will encoded using UTF-8 and the result written to the wire:

    request.write("hello");

A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.

    request.write("hello", "UTF-16");

The [`HttpClientRequest.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#write) function is asynchronous and always returns immediately after the write has been queued. The actual write might complete some time later.

If you are just writing a single string or Buffer to the HTTP request you can write it and end the request in a single call to the end function.

The first call to `write` will result in the request headers being written to the request. Consequently, if you are not using HTTP chunking then you must set the `Content-Length` header before writing to the request, since it will be too late otherwise. If you are using HTTP chunking you do not have to worry.
###### Ending HTTP requests

Once you have finished with the HTTP request you must call the [`HttpClientRequest.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#end) function on it.

This function can be invoked in several ways:

With no arguments, the request is simply ended.

    request.end();

The function can also be called with a string or Buffer in the same way `write` is called. In this case it's just the same as calling write with a string or Buffer followed by calling `end` with no arguments.
###### Writing Request Headers

To write headers to the request, add them using the [`HttpClientRequest.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#headers) method:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete((HttpClientResponse resp) => print("Got a response: ``resp.status``"));
    request.headers { "Some-Header"->"Some-Value" };
    request.end();
###### Request timeouts

You can set a timeout for specific Http Request using the [`HttpClientRequest.timeout`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#timeout) attribute. If the request does not return any data within the timeout period the [`HttpClientRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#response) will be rejected and the request will be closed.
###### HTTP chunked requests

Vert.x supports [HTTP Chunked Transfer Encoding](http://en.wikipedia.org/wiki/Chunked_transfer_encoding) for requests. This allows the HTTP request body to be written in chunks, and is normally used when a large request body is being streamed to the server, whose size is not known in advance.

You put the HTTP request into chunked mode as follows:

    request.chunked = true;

Default is non-chunked. When in chunked mode, each call to request.write(...) will result in a new HTTP chunk being written out.
##### HTTP Client Responses

Client responses are received as an argument to the response handler that is passed into one of the request methods on the HTTP client.

The response object provides a [`HttpClientResponse.stream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#stream) attribute, so it can be pumped to a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) like any other [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html).

To query the status code of the response use the [`HttpClientResponse.statusMessage`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#statusMessage) attribute. The [`HttpClientResponse.statusMessage`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#statusMessage) attribute contains the status message. For example:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete {
      void onFulfilled(HttpClientResponse resp) {
        print("server returned status code: ``resp.statusCode``");
        print("server returned status message: ``resp.statusMessage``");
      }
    };
    request.end();
###### Reading Data from the Response Body

The API for reading an HTTP client response body is very similar to the API for reading a HTTP server request body.

Sometimes an HTTP response contains a body that we want to read. Like an HTTP request, the client response promise is resolved when all the response headers have arrived, not when the entire response body has arrived.

To receive the response body, you use the [`HttpClientResponse.parseBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#parseBody) on the response object which returns a `Promise<Body>` that is resolved when the response body has been parsed. Here's an example:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete((HttpClientResponse resp) => resp.parseBody(binaryBody).onComplete((ByteBuffer body) => print("I received  + ``body.size`` + bytes")));
    request.end();

The response object provides the [`HttpClientResponse.stream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#stream) interface so you can pump the response body to a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html). See the chapter on streams and pump for a detailed explanation.
###### Reading cookies

You can read the list of cookies from the response using the [`HttpClientResponse.cookies`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#cookies) attribute.
##### 100-Continue Handling

todo
##### HTTP Compression

Vert.x comes with support for HTTP Compression out of the box. Which means the HTTPClient can let the remote Http server know that it supports compression, and so will be able to handle compressed response bodies. A Http server is free to either compress with one of the supported compression algorithm or send the body back without compress it at all. So this is only a hint for the Http server which it may ignore at all.

To tell the Http server which compression is supported by the [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) it will include a 'Accept-Encoding' header with the supported compression algorithm as value. Multiple compression algorithms are supported. In case of Vert.x this will result in have the following header added:

    Accept-Encoding: gzip, deflate

The Http Server will choose then from one of these. You can detect if a HttpServer did compress the body by checking for the 'Content-Encoding' header in the response sent back from it.

If the body of the response was compressed via gzip it will include for example the following header:

    Content-Encoding: gzip

To enable compression you only need to do:

    HttpClient client = vertx.createHttpClient();
    client.tryUserCompression = true;

The default is false.
#### Pumping Requests and Responses

The HTTP client and server requests and responses all implement either [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) or [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html). This means you can pump between them and any other read and write streams.
#### HTTPS Servers

HTTPS servers are very easy to write using Vert.x.

An HTTPS server has an identical API to a standard HTTP server. Getting the server to use HTTPS is just a matter of configuring the HTTP Server before listen is called.

Configuration of an HTTPS server is done in exactly the same way as configuring a [`NetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html) for SSL. Please see SSL server chapter for detailed instructions.
#### HTTPS Clients

HTTPS clients can also be very easily written with Vert.x

Configuring an HTTP client for HTTPS is done in exactly the same way as configuring a [`NetClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html) for SSL. Please see SSL client chapter for detailed instructions.
#### Scaling HTTP servers

Scaling an HTTP or HTTPS server over multiple cores is as simple as deploying more instances of the verticle. For example:

    vertx runmod com.mycompany~my-mod~1.0 -instance 20

Or, for a raw verticle:

    vertx run foo.MyServer -instances 20

The scaling works in the same way as scaling a NetServer. Please see the chapter on scaling Net Servers for a detailed explanation of how this works.
### Routing HTTP requests with Pattern Matching

Vert.x lets you route HTTP requests to different handlers based on pattern matching on the request path. It also enables you to extract values from the path and use them as parameters in the request.

This is particularly useful when developing REST-style web applications.

To do this you simply create an instance of [`RouteMatcher`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html) and use it as handler in an HTTP server. See the chapter on HTTP servers for more information on setting HTTP handlers. Here's an example:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    server.requestHandler(routeMatcher.handle).listen { port = 8080; host = "localhost"; };
#### Specifying matches.

You can then add different matches to the route matcher. For example, to send all GET requests with path `/animals/dogs` to one handler and all GET requests with path `/animals/cats` to another handler you would do:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    routerMarcher.get("/animals/dogs", (HttpServerRequest req) => req.response().end("You requested dogs"));
    routerMarcher.get("/animals/cats", (HttpServerRequest req) => req.response().end("You requested cats"));
    server.requestHandler(router.handle).listen { port = 8080; host = "localhost"; };

Corresponding methods exist for each HTTP method - `get`, `post`, `put`, `delete`, `head`, `options`, `trace`, `connect` and `patch`.

There's also an `all` method which applies the match to any HTTP request method.

The handler specified to the method is just a normal HTTP server request handler, the same as you would supply to the requestHandler method of the HTTP server.

You can provide as many matches as you like and they are evaluated in the order you added them, the first matching one will receive the request.

A request is sent to at most one handler.
#### Extracting parameters from the path

If you want to extract parameters from the path, you can do this too, by using the : (colon) character to denote the name of a parameter. For example:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    routerMarcher.get {
      pattern = "/:blogname/:post";
      void handler(HttpServerRequest req) {
        assert(exists blogName = req.params["blogname"]);
        assert(exists post = req.params["post"]);
        req.response.end("blogname is ``blogName`` post is ``post``");
      }
    };
    server.requestHandler(router.handle).listen { port = 8080; host = "localhost"; };

Any params extracted by pattern matching are added to the map of request parameters.

In the above example, a PUT request to `/myblog/post1 would result in the variable`blogName`getting the value`myblog`and the
variable`post`getting the value`post1`.

Valid parameter names must start with a letter of the alphabet and be followed by any letters of the alphabet or digits or the underscore character.
#### Extracting params using Regular Expressions

Regular Expressions can be used to extract more complex matches. In this case capture groups are used to capture any parameters.

Since the capture groups are not named they are added to the request with names `param0`, `param1`, `param2`, etc.

Corresponding methods exist for each HTTP method - [`RouteMatcher.getWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#getWithRegEx), [`RouteMatcher.postWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#postWithRegEx), [`RouteMatcher.putWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#putWithRegEx), [`RouteMatcher.deleteWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#deleteWithRegEx), [`RouteMatcher.headWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#headWithRegEx), [`RouteMatcher.optionsWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#optionsWithRegEx), [`RouteMatcher.traceWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#traceWithRegEx), [`RouteMatcher.connectWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#connectWithRegEx) and [`RouteMatcher.patchWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#patchWithRegEx).

There's also an [`RouteMatcher.allWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#allWithRegEx) method which applies the match to any HTTP request method.

For example:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    routerMarcher.get {
      pattern = "\\/([^\\/]+)\\/([^\\/]+)";
      void handler(HttpServerRequest req) {
        assert(exists first = req.params["param0"]);
        assert(exists second = req.params["param1"]);
        req.response.end("first is ``first`` and second is ``second``");
      }
    };
    server.requestHandler(router.handle).listen { port = 8080; host = "localhost"; };

Run the above and point your browser at `http://localhost:8080/animals/cats`.
#### Handling requests where nothing matches

You can use the [`RouteMatcher.noMatch`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#noMatch) method to specify a handler that will be called if nothing matches. If you don't specify a no match handler and nothing matches, a 404 will be returned.

    routeMatcher.noMatch((HttpServerRequest req) => req.response.end("Nothing matched"));
#### WebSockets

[WebSockets](http://en.wikipedia.org/wiki/WebSocket) are a web technology that allows a full duplex socket-like connection between HTTP servers and HTTP clients (typically browsers).
##### WebSockets on the server

To use WebSockets on the server you create an HTTP server as normal, but instead of setting a `requestHandler` you set a `websocketHandler` on the server.

    value server = vertx.createHttpServer();
    
    server.websocketHandler {
      void handle(ServerWebSocket ws) {
        // A WebSocket has connected!
      }
    }.listen(8080, "localhost");
###### Reading from and Writing to WebSockets

The `websocket` instance passed into the handler provides access to the [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html), so you can read and write data to it in the normal ways. I.e by setting a [`ReadStream.dataHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html#dataHandler) and calling the [`WriteStream.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#write) method.

See the chapter on streams and pumps for more information.

For example, to echo all data received on a WebSocket:

    value server = vertx.createHttpServer();
    
    server.websocketHandler {
      void handle(ServerWebSocket ws) {
        value pump = ws.readStream.pump(ws.writeStream);
        pump.start();
     }
    }.listen(8080, "localhost");

The `websocket instance also has method`writeBinaryFrame`for writing binary data. This has the same effect
as calling`write`.

Another method `writeTextFrame` also exists for writing text data. This is equivalent to calling

    websocket.write(Buffer("some-string"));
###### Rejecting WebSockets

Sometimes you may only want to accept WebSockets which connect at a specific path.

To check the path, you can query the [`ServerWebSocket.path`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/ServerWebSocket.type.html#path) attribute of the websocket. You can then call the [`ServerWebSocket.reject`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/ServerWebSocket.type.html#reject) method to reject the websocket.

    value server = vertx.createHttpServer();
    
    server.websocketHandler { 
      void handle(ServerWebSocket ws) {
        if (ws.path().equals("/services/echo")) {
          value pump = ws.readStream.pump(ws.writeStream);
          pump.start();
        } else {
          ws.reject();
        }
      }
    }.listen(8080, "localhost");
###### Headers on the websocket

You can use the [`ServerWebSocket.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/ServerWebSocket.type.html#headers) method to retrieve the headers passed in the Http Request from the client that caused the upgrade to websockets.
##### WebSockets on the HTTP client

To use WebSockets from the HTTP client, you create the HTTP client as normal, then call the [`HttpClient.connectWebsocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#connectWebsocket) function, passing in the URI that you wish to connect to at the server, and a handler.

The handler will then get called if the WebSocket successfully connects. If the WebSocket does not connect - perhaps the server rejects it - then any exception handler on the HTTP client will be called.

Here's an example of WebSocket connection:

    value client = vertx.createHttpClient();
    client.host = "foo.com";
    
    client.connectWebsocket("/some-uri", (WebSocket ws) => print("Connected!) });

Note that the host (and port) is set on the [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) instance, and the uri passed in the connect is __typically__ a relative URI.

Again, the client side WebSocket implements [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html), so you can read and write to it in the same way as any other stream object.
##### WebSockets in the browser

To use WebSockets from a compliant browser, you use the standard WebSocket API. Here's some example client side JavaScript which uses a WebSocket.

    <script>
    
      var socket = new WebSocket("ws://foo.com/services/echo");
    
      socket.onmessage = function(event) {
        alert("Received data from websocket: " + event.data);
      }
    
      socket.onopen = function(event) {
        alert("Web Socket opened");
        socket.send("Hello World");
      };
    
      socket.onclose = function(event) {
        alert("Web Socket closed");
      };
    
    </script>

For more information see the [WebSocket API documentation](http://dev.w3.org/html5/websockets/)

# WebSockets

## Writing HTTP Servers and Clients
### Writing HTTP servers

Vert.x allows you to easily write full featured, highly performant and scalable HTTP servers.
#### Creating an HTTP Server

To create an HTTP server you call the `createHttpServer` method on your `vertx` instance.

    HttpServer server = vertx.createHttpServer();
#### Start the Server Listening

To tell that server to listen for incoming requests you use the listen method:

    HttpServer server = vertx.createHttpServer();
    server.listen(8080, "myhost");

The first parameter to listen is the `port`, The second parameter is the hostname or ip address. If it is omitted it will default to 0.0.0.0 which means it will listen at all available interfaces. Note that you could also do it this way:

    server.listen { port = 8080; hostName = "myhost"; };

The actual bind is asynchronous so the server might not actually be listening until some time after the call to listen has returned. If you want to be notified when the server is actually listening you can use the `Promise<HttpServer>` returned by the `listen` method. For example:

    server.listen(8080, "myhost").
       onComplete(
         (HttpServer server) => print("Listen succeeded"),
         (Exception e) => print("Listen failed")
       );
#### Getting Notified of Incoming Requests

To be notified when a request arrives you need to set a request handler. This is done by calling the requestHandler method of the server, passing in the handler:

    value server = vertx.createHttpServer();
    
    void handle(HttpServerRequest request) {
      print(""A request has arrived on the server!");
      request.response.end();
    }
    
    server.requestHandler(handle);
    server.listen(8080, "localhost");
#### Handling HTTP Requests

So far we have seen how to create an `HttpServer` and be notified of requests. Lets take a look at how to handle the requests and do something useful with them.

When a request arrives, the request handler is called passing in an instance of `HttpServerRequest`. This object represents the server side HTTP request.

The handler is called when the headers of the request have been fully read. If the request contains a body, that body may arrive at the server some time after the request handler has been called.

It contains functions to get the URI, path, request headers and request parameters. It also contains a `response` reference to an object that represents the server side HTTP response for the object.
##### Request Method

The request object has a `method` attribute which returns a string representing what HTTP method was requested. This attribute has the type `ceylon.net.http.Method`.
##### Request Version

The request object has a method [`HttpServerRequest.version`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#version) attribute which returns an [`HttpVersion`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpVersion.type.html)(enum) representing the HTTP version.
##### Request URI

The request object has an [`HttpServerRequest.uri`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#uri) attribute which returns the full URI (Uniform Resource Locator) of the request. For example, if the request URI was: `/a/b/c/page.html?param1=abc&param2=xyz` then it would return the corresponding `ceylon.net.uri.Uri`. Request URIs can be relative or absolute (with a domain) depending on what the client sent. In most cases they will be relative.
##### Request Path

The request object has a [`HttpServerRequest.path`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#path) attribute which returns the path of the request. For example, if the request URI was `/a/b/c/page.html?param1=abc&param2=xyz` then path would return the string `/a/b/c/page.html`
##### Request Query

The request object has a [`HttpServerRequest.query`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#query) which contains the query of the request as a `ceylon.net.uri.Query` object.
##### Request Headers

The request headers are available using the [`HttpServerRequest.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#headers) attribute on the request object. The returned object is an instance of `Map<String,{String+}>`.

Here's an example that echoes the headers to the output of the response. Run it and point your browser at http://localhost:8080 to see the headers.

    value server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      value sb = StringBuilder();
      for (header in request.headers) {
        for (val in header.item) {
          sb.append("``header.key``: ``val``");
        }
      }
      request.response.end(sb.string);
    }
    server.requestHandler(handle).listen(8080, "localhost);
##### Request params

Similarly to the headers, the request parameters are available using the [`HttpServerRequest.params`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#params) attribute on the request object. Request parameters are sent on the request URI, after the path. For example if the URI was:

    /page.html?param1=abc&param2=xyz

Then the params multimap would contain the following entries:

    param1: 'abc'
    param2: 'xyz
##### Remote Address

Use the [`HttpServerRequest.remoteAddress`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#remoteAddress) attribute to find out the address of the other side of the HTTP connection.
##### Absolute URI

Use the method [`HttpServerRequest.absoluteURI`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#absoluteURI) to return the absolute URI corresponding to the request.
##### Reading Data from the Request Body

Sometimes an HTTP request contains a request body that we want to read. As previously mentioned the request handler is called when only the headers of the request have arrived so the HttpServerRequest object does not contain the body. This is because the body may be very large and we don't want to create problems with exceeding available memory.

To receive the body, you need to call the [`HttpServerRequest.parseBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#parseBody) method on the request object with a [`BodyType`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/BodyType.type.html) implementation. This method returns a `Promise<Body>` that will be resolved when the body will be fully parsed, here's an example:

    value server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      Promise<ByteBuffer> p = request.parseBody(binaryBody);
      p.onComplete((ByteBuffer body) => print("I received ``body.size`` bytes"));
    }
    server.requestHandler(handle).listen(8080, "localhost");

There are several body type implementations:

* [`binaryBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/binaryBody.type.html) : provides a `ceylon.io.ByteBuffer` for any mime type
* [`textBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/textBody.type.html) : provides a Ceylon string for mime type `text/*`
* [`jsonBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/jsonBody.type.html) : provides a `ceylon.json.Object` for mime type `application/json`

It is of course possible to implement custom [`BodyType`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/BodyType.type.html), for instance here is the implementation for text content:

    shared object textBody satisfies BodyType<String> {
      shared actual Boolean accept(String mimeType) => mimeType.startsWith("text/");
        shared actual String parse(Charset? charset, Buffer data) {
          if (exists charset) {
            return data.toString(charset.name);
          } else {
            return data.string;
          }
       }
    }

Note that this API is different from the original Vert.x API. Also this current implementation will parse the full body before calling the body type object, in the future this will likely evolve to provide a finer granularity for body parsing.
##### Handling Multipart Form Uploads

Vert.x understands file uploads submitted from HTML forms in browsers. In order to handle file uploads you should set the [`HttpServerRequest.uploadHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#uploadHandler) on the request. The handler will be called once for each upload in the form.

    request.expectMultiPart(true);
    
    request.uploadHandler {
      void onUpload(HttpServerFileUpload upload) {
      }
    });

The [`HttpServerFileUpload`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerFileUpload.type.html) class implements [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) so you read the data and stream it to any object that implements [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) using a Pump, as previously discussed.

You can also stream it directly to disk using the convenience method [`HttpServerFileUpload.streamToFileSystem`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerFileUpload.type.html#streamToFileSystem).

    request.expectMultiPart(true);
    
    request.uploadHandler {
      void onUpload(HttpServerFileUpload upload) {
        upload.streamToFileSystem("uploads/``upload.filename()``");
      }
    });
##### Handling Multipart Form Attributes

If the request corresponds to an HTML form that was submitted you can use the [`HttpServerRequest.formAttributes`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#formAttributes) promise to access the form attributes. This promise is resolved after all of the request has been read - this is because form attributes are encoded in the request body not in the request headers.

    req.formAttributes.onComplete((Map<String, {String+}> formAttributes) => print("Do something with them"));

When the request does not have form attributes the `formAttributes` promise is rejected.
#### HTTP Server Responses

As previously mentioned, the HTTP request object contains a [`HttpServerRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html#response) attribute. This returns the HTTP response for the request. You use it to write the response back to the client.
##### Setting Status Code and Message

To set the HTTP status code for the response use the [`HttpServerResponse.status`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#status) method, e.g.

    HttpServer server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      request.response.status {
        code = 739;
        message = "Too many gerbils";
      }.end();
    }
    server.requestHandler(handle).listen(8080, "localhost");

You can also set the status message. If you do not set the status message a default message will be used.

The default value for the status code is `200`.
###### Writing HTTP responses

To write data to an HTTP response, you invoke the write function. This function can be invoked multiple times before the response is ended. It can be invoked in a few ways:

With a single buffer:

    Buffer myBuffer = ...
    request.response.write(myBuffer);

A string. In this case the string will encoded using UTF-8 and the result written to the wire.

    request.response.write("hello");

A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.

    request.response.write(["hello", "UTF-16"]);

The [`HttpServerResponse.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#write) function is asynchronous and always returns immediately after the write has been queued. If you are just writing a single string or Buffer to the HTTP response you can write it and end the response in a single call to the [`HttpServerResponse.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#end) method.

The first call to [`HttpServerResponse.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#write) results in the response header being being written to the response.

Consequently, if you are not using HTTP chunking then you must set the `Content-Length` header before writing to the response, since it will be too late otherwise. If you are using HTTP chunking you do not have to worry.
###### Ending HTTP responses

Once you have finished with the HTTP response you must call the [`HttpServerResponse.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#end) function on it.

This function can be invoked in several ways:

With no arguments, the response is simply ended.

    request.response.end();

The function can also be called with a string or Buffer in the same way [`HttpServerResponse.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#write) is called. In this case it's just the same as calling write with a string or Buffer followed by calling [`HttpServerResponse.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#end) with no arguments. For example:

    request.response.end("That's all folks");
###### Closing the underlying connection

You can close the underlying TCP connection of the request by calling the [`HttpServerResponse.close`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#close) method.

    request.response.close();
###### Response headers

HTTP response headers can be added to the response by passing them to the [`HttpServerResponse.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#headers) methods:

    request.response.headers { "Cheese"->"Stilton", "Hat colour"->"Mauve" };

Response headers must all be added before any parts of the response body are written.
###### Chunked HTTP Responses and Trailers

Vert.x supports [HTTP Chunked Transfer Encoding](http://en.wikipedia.org/wiki/Chunked_transfer_encoding). This allows the HTTP response body to be written in chunks, and is normally used when a large response body is being streamed to a client, whose size is not known in advance.

You put the HTTP response into chunked mode as follows:

    req.response.setChunked(true);

Default is non-chunked. When in chunked mode, each call to `response.write(...)` will result in a new HTTP chunk being written out.

When in chunked mode you can also write HTTP response trailers to the response. These are actually written in the final chunk of the response.

To add trailers to the response, add them to the multimap returned from the trailers() method:

    request.response.trailers {
      "Philosophy"->"Solipsism",
      "Favourite-Shakin-Stevens-Song"->"Behind the Green Door"
    };
##### Serving files directly from disk

Not yet implemented.
##### Pumping Responses

The [`HttpServerResponse.stream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerResponse.type.html#stream) provides a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) you can pump to it from any [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html), e.g. an [`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html), [`NetSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetSocket.type.html), [`WebSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/WebSocket.type.html) or [`HttpServerRequest`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServerRequest.type.html).

Here's an example which echoes HttpRequest headers and body back in the HttpResponse. It uses a pump for the body, so it will work even if the HTTP request body is much larger than can fit in memory at any one time:

    HttpServer server = vertx.createHttpServer();
    void handle(HttpServerRequest request) {
      HttpServerResponse resp = req.response;
      resp.headers(req.headers);
      req.stream.pump(resp.stream).start();
      req.stream.endHandler(resp.close);
    }
    server.requestHandler(handle).listen(8080, "localhost");
##### HTTP Compression

Vert.x comes with support for HTTP Compression out of the box. Which means you are able to automatically compress the body of the responses before they are sent back to the Client. If the client does not support HTTP Compression the responses are sent back without compressing the body. This allows to handle Client that support HTTP Compression and those that not support it at the same time.

To enable compression you only need to do:

    HttpServer server = vertx.createHttpServer();
    server.compressionSupported = true;

The default is false.

When HTTP Compression is enabled the [`HttpServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServer.type.html) will check if the client did include an 'Accept-Encoding' header which includes the supported compressions. Common used are deflate and gzip. Both are supported by Vert.x. Once such a header is found the [`HttpServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpServer.type.html) will automatically compress the body of the response with one of the supported compressions and send it back to the client.

Be aware that compression may be able to reduce network traffic but is more cpu-intensive.
#### Writing HTTP Clients
##### Creating an HTTP Client

To create an HTTP client you call the [`Vertx.createHttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/Vertx.type.html#createHttpClient) method on your vertx instance:

    HttpClient client = vertx.createHttpClient();

You set the port and hostname (or ip address) that the client will connect to using the [`HttpClient.host`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#host) and [`HttpClient.port`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#port) attributes:

    HttpClient client = vertx.createHttpClient();
    client.port = 8181;
    client.host = "foo.com";

You can also set the port and host when creating the client:

    HttpClient client = vertx.createHttpClient {
      port = 8181;
      host = "foo.com";
    };

A single [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) always connects to the same host and port. If you want to connect to different servers, create more instances.

The default port is `80` and the default host is `localhost`. So if you don't explicitly set these values that's what the client will attempt to connect to.
##### Pooling and Keep Alive

By default the [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) pools HTTP connections. As you make requests a connection is borrowed from the pool and returned when the HTTP response has ended.

If you do not want connections to be pooled you can set [`HttpClient.keepAlive`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#keepAlive) to false:

    HttpClient client = vertx.createHttpClient();
    client.port = 8181;
    client.host = "foo.com";
    client.keepAlive = false;

In this case a new connection will be created for each HTTP request and closed once the response has ended.

You can set the maximum number of connections that the client will pool as follows:

    HttpClient client = vertx.createHttpClient();
    client.port = 8181;
    client.host = "foo.com";
    client.maxPoolSize = 10;

The default value is `1`.
##### Closing the client

Any HTTP clients created in a verticle are automatically closed for you when the verticle is stopped, however if you want to close it explicitly you can:

    client.close();
##### Making Requests

To make a request using the client you invoke one the methods named after the HTTP method that you want to invoke.

For example, to make a `POST` request:

    value client = vertx.createHttpClient{ host = "foo.com" };
    HttpClientRequest request = client.post("/some-path"/);
    request.response.onComplete((HttpClientResponse resp) => print("Got a response: ``resp.status``"));
    request.end();

To make a PUT request use the [`HttpClient.put`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#put) method, to make a GET request use the [`HttpClient.get`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#get) method, etc.

Legal request methods are: [`HttpClient.get`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#get), [`HttpClient.put`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#put), [`HttpClient.post`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#post), [`HttpClient.delete`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#delete), [`HttpClient.head`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#head), [`HttpClient.options`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#options), [`HttpClient.connect`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#connect), [`HttpClient.trace`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#trace) and [`HttpClient.patch`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#patch).

The general modus operandi is you invoke the appropriate method passing in the request URI. The `Promise<HttpClientResponse` [`HttpClientRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#response)] attribute will be resolved when the corresponding response arrives. Note that the response promise should be used before the [`HttpClientRequest.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#end) method is called, so the promise will be resolved by the Vert.x thread.

The value specified in the request URI corresponds to the Request-URI as specified in [Section 5.1.2 of the HTTP specification](http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html). __In most cases it will be a relative URI__.

__Please note that the domain/port that the client connects to is determined by [`HttpClient.port`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#port) and [`HttpClient.host`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#host), and is not parsed from the uri.__

The return value from the appropriate request method is an instance of [`HttpClientRequest`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html). You can use this to add headers to the request, and to write to the request body. The request object implements [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html).

Once you have finished with the request you must call the [`HttpClientRequest.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#end) method.

If you don't know the name of the request method in advance there is a general [`HttpClient.request`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#request) method which takes the HTTP method as a parameter:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete((HttpClientResponse resp) => print("Got a response: ``resp.status``"));
    request.end();
###### Handling exceptions

The [`HttpClientRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#response) promise will be rejected when the request fails.
###### Writing to the request body

Writing to the client request body has a very similar API to writing to the server response body.

To write data to an [`HttpClientRequest`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html) object, you invoke the [`HttpClientRequest.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#write) function. This function can be called multiple times before the request has ended. It can be invoked in a few ways:

With a single buffer:

    Buffer myBuffer = Buffer(...);
    sock.write(myBuffer);

A string. In this case the string will encoded using UTF-8 and the result written to the wire:

    request.write("hello");

A string and an encoding. In this case the string will encoded using the specified encoding and the result written to the wire.

    request.write("hello", "UTF-16");

The [`HttpClientRequest.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#write) function is asynchronous and always returns immediately after the write has been queued. The actual write might complete some time later.

If you are just writing a single string or Buffer to the HTTP request you can write it and end the request in a single call to the end function.

The first call to `write` will result in the request headers being written to the request. Consequently, if you are not using HTTP chunking then you must set the `Content-Length` header before writing to the request, since it will be too late otherwise. If you are using HTTP chunking you do not have to worry.
###### Ending HTTP requests

Once you have finished with the HTTP request you must call the [`HttpClientRequest.end`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#end) function on it.

This function can be invoked in several ways:

With no arguments, the request is simply ended.

    request.end();

The function can also be called with a string or Buffer in the same way `write` is called. In this case it's just the same as calling write with a string or Buffer followed by calling `end` with no arguments.
###### Writing Request Headers

To write headers to the request, add them using the [`HttpClientRequest.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#headers) method:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete((HttpClientResponse resp) => print("Got a response: ``resp.status``"));
    request.headers { "Some-Header"->"Some-Value" };
    request.end();
###### Request timeouts

You can set a timeout for specific Http Request using the [`HttpClientRequest.timeout`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#timeout) attribute. If the request does not return any data within the timeout period the [`HttpClientRequest.response`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientRequest.type.html#response) will be rejected and the request will be closed.
###### HTTP chunked requests

Vert.x supports [HTTP Chunked Transfer Encoding](http://en.wikipedia.org/wiki/Chunked_transfer_encoding) for requests. This allows the HTTP request body to be written in chunks, and is normally used when a large request body is being streamed to the server, whose size is not known in advance.

You put the HTTP request into chunked mode as follows:

    request.chunked = true;

Default is non-chunked. When in chunked mode, each call to request.write(...) will result in a new HTTP chunk being written out.
##### HTTP Client Responses

Client responses are received as an argument to the response handler that is passed into one of the request methods on the HTTP client.

The response object provides a [`HttpClientResponse.stream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#stream) attribute, so it can be pumped to a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) like any other [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html).

To query the status code of the response use the [`HttpClientResponse.statusMessage`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#statusMessage) attribute. The [`HttpClientResponse.statusMessage`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#statusMessage) attribute contains the status message. For example:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete {
      void onFulfilled(HttpClientResponse resp) {
        print("server returned status code: ``resp.statusCode``");
        print("server returned status message: ``resp.statusMessage``");
      }
    };
    request.end();
###### Reading Data from the Response Body

The API for reading an HTTP client response body is very similar to the API for reading a HTTP server request body.

Sometimes an HTTP response contains a body that we want to read. Like an HTTP request, the client response promise is resolved when all the response headers have arrived, not when the entire response body has arrived.

To receive the response body, you use the [`HttpClientResponse.parseBody`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#parseBody) on the response object which returns a `Promise<Body>` that is resolved when the response body has been parsed. Here's an example:

    value client = vertx.createHttpClient{ host = "foo.com" };
    value request = client.request(post, "/some-path/");
    request.response.onComplete((HttpClientResponse resp) => resp.parseBody(binaryBody).onComplete((ByteBuffer body) => print("I received  + ``body.size`` + bytes")));
    request.end();

The response object provides the [`HttpClientResponse.stream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#stream) interface so you can pump the response body to a [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html). See the chapter on streams and pump for a detailed explanation.
###### Reading cookies

You can read the list of cookies from the response using the [`HttpClientResponse.cookies`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClientResponse.type.html#cookies) attribute.
##### 100-Continue Handling

todo
##### HTTP Compression

Vert.x comes with support for HTTP Compression out of the box. Which means the HTTPClient can let the remote Http server know that it supports compression, and so will be able to handle compressed response bodies. A Http server is free to either compress with one of the supported compression algorithm or send the body back without compress it at all. So this is only a hint for the Http server which it may ignore at all.

To tell the Http server which compression is supported by the [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) it will include a 'Accept-Encoding' header with the supported compression algorithm as value. Multiple compression algorithms are supported. In case of Vert.x this will result in have the following header added:

    Accept-Encoding: gzip, deflate

The Http Server will choose then from one of these. You can detect if a HttpServer did compress the body by checking for the 'Content-Encoding' header in the response sent back from it.

If the body of the response was compressed via gzip it will include for example the following header:

    Content-Encoding: gzip

To enable compression you only need to do:

    HttpClient client = vertx.createHttpClient();
    client.tryUserCompression = true;

The default is false.
#### Pumping Requests and Responses

The HTTP client and server requests and responses all implement either [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) or [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html). This means you can pump between them and any other read and write streams.
#### HTTPS Servers

HTTPS servers are very easy to write using Vert.x.

An HTTPS server has an identical API to a standard HTTP server. Getting the server to use HTTPS is just a matter of configuring the HTTP Server before listen is called.

Configuration of an HTTPS server is done in exactly the same way as configuring a [`NetServer`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetServer.type.html) for SSL. Please see SSL server chapter for detailed instructions.
#### HTTPS Clients

HTTPS clients can also be very easily written with Vert.x

Configuring an HTTP client for HTTPS is done in exactly the same way as configuring a [`NetClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/net/NetClient.type.html) for SSL. Please see SSL client chapter for detailed instructions.
#### Scaling HTTP servers

Scaling an HTTP or HTTPS server over multiple cores is as simple as deploying more instances of the verticle. For example:

    vertx runmod com.mycompany~my-mod~1.0 -instance 20

Or, for a raw verticle:

    vertx run foo.MyServer -instances 20

The scaling works in the same way as scaling a NetServer. Please see the chapter on scaling Net Servers for a detailed explanation of how this works.
### Routing HTTP requests with Pattern Matching

Vert.x lets you route HTTP requests to different handlers based on pattern matching on the request path. It also enables you to extract values from the path and use them as parameters in the request.

This is particularly useful when developing REST-style web applications.

To do this you simply create an instance of [`RouteMatcher`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html) and use it as handler in an HTTP server. See the chapter on HTTP servers for more information on setting HTTP handlers. Here's an example:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    server.requestHandler(routeMatcher.handle).listen { port = 8080; host = "localhost"; };
#### Specifying matches.

You can then add different matches to the route matcher. For example, to send all GET requests with path `/animals/dogs` to one handler and all GET requests with path `/animals/cats` to another handler you would do:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    routerMarcher.get("/animals/dogs", (HttpServerRequest req) => req.response().end("You requested dogs"));
    routerMarcher.get("/animals/cats", (HttpServerRequest req) => req.response().end("You requested cats"));
    server.requestHandler(router.handle).listen { port = 8080; host = "localhost"; };

Corresponding methods exist for each HTTP method - `get`, `post`, `put`, `delete`, `head`, `options`, `trace`, `connect` and `patch`.

There's also an `all` method which applies the match to any HTTP request method.

The handler specified to the method is just a normal HTTP server request handler, the same as you would supply to the requestHandler method of the HTTP server.

You can provide as many matches as you like and they are evaluated in the order you added them, the first matching one will receive the request.

A request is sent to at most one handler.
#### Extracting parameters from the path

If you want to extract parameters from the path, you can do this too, by using the : (colon) character to denote the name of a parameter. For example:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    routerMarcher.get {
      pattern = "/:blogname/:post";
      void handler(HttpServerRequest req) {
        assert(exists blogName = req.params["blogname"]);
        assert(exists post = req.params["post"]);
        req.response.end("blogname is ``blogName`` post is ``post``");
      }
    };
    server.requestHandler(router.handle).listen { port = 8080; host = "localhost"; };

Any params extracted by pattern matching are added to the map of request parameters.

In the above example, a PUT request to `/myblog/post1 would result in the variable`blogName`getting the value`myblog`and the
variable`post`getting the value`post1`.

Valid parameter names must start with a letter of the alphabet and be followed by any letters of the alphabet or digits or the underscore character.
#### Extracting params using Regular Expressions

Regular Expressions can be used to extract more complex matches. In this case capture groups are used to capture any parameters.

Since the capture groups are not named they are added to the request with names `param0`, `param1`, `param2`, etc.

Corresponding methods exist for each HTTP method - [`RouteMatcher.getWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#getWithRegEx), [`RouteMatcher.postWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#postWithRegEx), [`RouteMatcher.putWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#putWithRegEx), [`RouteMatcher.deleteWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#deleteWithRegEx), [`RouteMatcher.headWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#headWithRegEx), [`RouteMatcher.optionsWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#optionsWithRegEx), [`RouteMatcher.traceWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#traceWithRegEx), [`RouteMatcher.connectWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#connectWithRegEx) and [`RouteMatcher.patchWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#patchWithRegEx).

There's also an [`RouteMatcher.allWithRegEx`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#allWithRegEx) method which applies the match to any HTTP request method.

For example:

    value server = vertx.createHttpServer();
    value routeMatcher = RouteMatcher();
    routerMarcher.get {
      pattern = "\\/([^\\/]+)\\/([^\\/]+)";
      void handler(HttpServerRequest req) {
        assert(exists first = req.params["param0"]);
        assert(exists second = req.params["param1"]);
        req.response.end("first is ``first`` and second is ``second``");
      }
    };
    server.requestHandler(router.handle).listen { port = 8080; host = "localhost"; };

Run the above and point your browser at `http://localhost:8080/animals/cats`.
#### Handling requests where nothing matches

You can use the [`RouteMatcher.noMatch`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/RouteMatcher.type.html#noMatch) method to specify a handler that will be called if nothing matches. If you don't specify a no match handler and nothing matches, a 404 will be returned.

    routeMatcher.noMatch((HttpServerRequest req) => req.response.end("Nothing matched"));
#### WebSockets

[WebSockets](http://en.wikipedia.org/wiki/WebSocket) are a web technology that allows a full duplex socket-like connection between HTTP servers and HTTP clients (typically browsers).
##### WebSockets on the server

To use WebSockets on the server you create an HTTP server as normal, but instead of setting a `requestHandler` you set a `websocketHandler` on the server.

    value server = vertx.createHttpServer();
    
    server.websocketHandler {
      void handle(ServerWebSocket ws) {
        // A WebSocket has connected!
      }
    }.listen(8080, "localhost");
###### Reading from and Writing to WebSockets

The `websocket` instance passed into the handler provides access to the [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html), so you can read and write data to it in the normal ways. I.e by setting a [`ReadStream.dataHandler`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html#dataHandler) and calling the [`WriteStream.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html#write) method.

See the chapter on streams and pumps for more information.

For example, to echo all data received on a WebSocket:

    value server = vertx.createHttpServer();
    
    server.websocketHandler {
      void handle(ServerWebSocket ws) {
        value pump = ws.readStream.pump(ws.writeStream);
        pump.start();
     }
    }.listen(8080, "localhost");

The `websocket instance also has method`writeBinaryFrame`for writing binary data. This has the same effect
as calling`write`.

Another method `writeTextFrame` also exists for writing text data. This is equivalent to calling

    websocket.write(Buffer("some-string"));
###### Rejecting WebSockets

Sometimes you may only want to accept WebSockets which connect at a specific path.

To check the path, you can query the [`ServerWebSocket.path`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/ServerWebSocket.type.html#path) attribute of the websocket. You can then call the [`ServerWebSocket.reject`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/ServerWebSocket.type.html#reject) method to reject the websocket.

    value server = vertx.createHttpServer();
    
    server.websocketHandler { 
      void handle(ServerWebSocket ws) {
        if (ws.path().equals("/services/echo")) {
          value pump = ws.readStream.pump(ws.writeStream);
          pump.start();
        } else {
          ws.reject();
        }
      }
    }.listen(8080, "localhost");
###### Headers on the websocket

You can use the [`ServerWebSocket.headers`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/ServerWebSocket.type.html#headers) method to retrieve the headers passed in the Http Request from the client that caused the upgrade to websockets.
##### WebSockets on the HTTP client

To use WebSockets from the HTTP client, you create the HTTP client as normal, then call the [`HttpClient.connectWebsocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html#connectWebsocket) function, passing in the URI that you wish to connect to at the server, and a handler.

The handler will then get called if the WebSocket successfully connects. If the WebSocket does not connect - perhaps the server rejects it - then any exception handler on the HTTP client will be called.

Here's an example of WebSocket connection:

    value client = vertx.createHttpClient();
    client.host = "foo.com";
    
    client.connectWebsocket("/some-uri", (WebSocket ws) => print("Connected!) });

Note that the host (and port) is set on the [`HttpClient`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/http/HttpClient.type.html) instance, and the uri passed in the connect is __typically__ a relative URI.

Again, the client side WebSocket implements [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html), so you can read and write to it in the same way as any other stream object.
##### WebSockets in the browser

To use WebSockets from a compliant browser, you use the standard WebSocket API. Here's some example client side JavaScript which uses a WebSocket.

    <script>
    
      var socket = new WebSocket("ws://foo.com/services/echo");
    
      socket.onmessage = function(event) {
        alert("Received data from websocket: " + event.data);
      }
    
      socket.onopen = function(event) {
        alert("Web Socket opened");
        socket.send("Hello World");
      };
    
      socket.onclose = function(event) {
        alert("Web Socket closed");
      };
    
    </script>

For more information see the [WebSocket API documentation](http://dev.w3.org/html5/websockets/)

# SockJS

## SockJS

WebSockets are a new technology, and many users are still using browsers that do not support them, or which support older, pre-final, versions.

Moreover, WebSockets do not work well with many corporate proxies. This means that's it's not possible to guarantee a WebSockets connection is going to succeed for every user.

Enter SockJS.

SockJS is a client side JavaScript library and protocol which provides a simple WebSocket-like interface to the client side JavaScript developer irrespective of whether the actual browser or network will allow real WebSockets.

It does this by supporting various different transports between browser and server, and choosing one at runtime according to browser and network capabilities. All this is transparent to you - you are simply presented with the WebSocket-like interface which __just works__.

Please see the [SockJS website](https://github.com/sockjs/sockjs-client) for more information.
### SockJS Server

Vert.x provides a complete server side SockJS implementation.

This enables Vert.x to be used for modern, so-called real-time (this is the modern meaning of real-time, not to be confused by the more formal pre-existing definitions of soft and hard real-time systems) web applications that push data to and from rich client-side JavaScript applications, without having to worry about the details of the transport.

To create a SockJS server you simply create a HTTP server as normal and then call the createSockJSServer method of your vertx instance passing in the Http server:

    value httpServer = vertx.createHttpServer();
    value sockJSServer = vertx.createSockJSServer(httpServer);

Each SockJS server can host multiple __applications__.

Each application is defined by some configuration, and provides a handler which gets called when incoming SockJS connections arrive at the server.

For example, to create a SockJS echo application:

    value httpServer = vertx.createHttpServer();
    
    value sockJSServer = vertx.createSockJSServer(httpServer);
    
    Object config = new Object { "prefix"->"/echo" };
    
    sockJSServer.installApp(config, (SockJSSocket sock) => Pump.createPump(sock, sock).start());
    
    httpServer.listen(8080);

The configuration is an instance of [`Object`](https://modules.ceylon-lang.org/repo/1/ceylon/json/1.1.0/module-doc/api/Object.type.html), which takes the following fields:

* `prefix`: A url prefix for the application. All http requests whose paths begins with selected prefix will be handled by the application. This property is mandatory.
* `insert_JSESSIONID`: Some hosting providers enable sticky sessions only to requests that have JSESSIONID cookie set. This setting controls if the server should set this cookie to a dummy value. By default setting JSESSIONID cookie is enabled. More sophisticated beaviour can be achieved by supplying a function.
* `session_timeout`: The server sends a `close` event when a client receiving connection have not been seen for a while. This delay is configured by this setting. By default the `close` event will be emitted when a receiving connection wasn't seen for 5 seconds.
* `heartbeat_period`: In order to keep proxies and load balancers from closing long running http requests we need to pretend that the connection is active and send a heartbeat packet once in a while. This setting controls how often this is done. By default a heartbeat packet is sent every 5 seconds.
* `max_bytes_streaming`: Most streaming transports save responses on the client side and don't free memory used by delivered messages. Such transports need to be garbage-collected once in a while. `max_bytes_streaming sets a minimum number of bytes that can be send over a single http streaming request before it will be closed. After that client needs to open new request. Setting this value to one effectively disables streaming and will make streaming transports to behave like polling transports. The default value is 128K.
* `library_url`: Transports which don't support cross-domain communication natively ('eventsource' to name one) use an iframe trick. A simple page is served from the SockJS server (using its foreign domain) and is placed in an invisible iframe. Code run from this iframe doesn't need to worry about cross-domain issues, as it's being run from domain local to the SockJS server. This iframe also does need to load SockJS javascript client library, and this option lets you specify its url (if you're unsure, point it to the latest minified SockJS client release, this is the default). The default value is `http://cdn.sockjs.org/sockjs-0.3.4.min.js`
### Reading and writing data from a SockJS server

The [`SockJSSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/sockjs/SockJSSocket.type.html) object passed into the SockJS handler provides access to [`SockJSSocket.readStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/sockjs/SockJSSocket.type.html#readStream) and [`SockJSSocket.writeStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/sockjs/SockJSSocket.type.html#writeStream) much like WebSocket. You can therefore use the standard API for reading and writing to the SockJS socket or using it in pumps.

See the chapter on Streams and Pumps for more information.
### SockJS client

For full information on using the SockJS client library please see the SockJS website. A simple example:

    <script>
      var sock = new SockJS('http://mydomain.com/my_prefix');
    
      sock.onopen = function() {
        console.log('open');
      };
    
      sock.onmessage = function(e) {
        console.log('message', e.data);
      };
    
      sock.onclose = function() {
        console.log('close');
      };
    </script>

As you can see the API is very similar to the WebSockets API.
## SockJS - EventBus Bridge
### Setting up the Bridge

By connecting up SockJS and the Vert.x event bus we create a distributed event bus which not only spans multiple Vert.x instances on the server side, but can also include client side JavaScript running in browsers.

We can therefore create a huge distributed bus encompassing many browsers and servers. The browsers don't have to be connected to the same server as long as the servers are connected.

On the server side we have already discussed the event bus API.

We also provide a client side JavaScript library called `vertxbus.js` which provides the same event bus API, but on the client side.

This library internally uses SockJS to send and receive data to a SockJS Vert.x server called the SockJS bridge. It's the bridge's responsibility to bridge data between SockJS sockets and the event bus on the server side.

Creating a Sock JS bridge is simple. You just call the `bridge method on the SockJS server.

You will also need to secure the bridge (see below).

The following example bridges the event bus to client side JavaScript:

    value server = vertx.createHttpServer();
    
    value config = Object { "prefix"->"/eventbus" };
    
    Array noPermitted = Array();
    noPermitted.add(new JsonObject());
    
    vertx.createSockJSServer(server).bridge(config, noPermitted, noPermitted);
    
    server.listen(8080);

To let all messages through you can specify two JSON array with a single empty JSON object which will match all messages.

__Be very careful!__
### Using the Event Bus from client side JavaScript

Once you've set up a bridge, you can use the event bus from the client side as follows:

In your web page, you need to load the script `vertxbus.js`, then you can access the Vert.x event bus API. Here's a rough idea of how to use it. For a full working examples, please consult the vert.x examples.

    <script src="http://cdn.sockjs.org/sockjs-0.3.4.min.js"></script>
    <script src='vertxbus.js'></script>
    
    <script>
    
      var eb = new vertx.EventBus('http://localhost:8080/eventbus');
    
      eb.onopen = function() {
        eb.registerHandler('some-address', function(message) {
          console.log('received a message: ' + JSON.stringify(message);
        });
        eb.send('some-address', {name: 'tim', age: 587});
      }
    
    </script>

You can find `vertxbus.js` in the client directory of the Vert.x distribution.

The first thing the example does is to create a instance of the event bus

    var eb = new vertx.EventBus('http://localhost:8080/eventbus');

The parameter to the constructor is the URI where to connect to the event bus. Since we create our bridge with the prefix eventbus we will connect there.

You can't actually do anything with the bridge until it is opened. When it is open the `onopen` handler will be called.

The client side event bus API for registering and unregistering handlers and for sending messages is the same as the server side one. Please consult the chapter on the event bus for full information.

__There is one more thing to do before getting this working, please read the following section....__
### Securing the Bridge

If you started a bridge like in the above example without securing it, and attempted to send messages through it you'd find that the messages mysteriously disappeared. What happened to them?

For most applications you probably don't want client side JavaScript being able to send just any message to any verticle on the server side or to all other browsers.

For example, you may have a persistor verticle on the event bus which allows data to be accessed or deleted. We don't want badly behaved or malicious clients being able to delete all the data in your database! Also, we don't necessarily want any client to be able to listen in on any topic.

To deal with this, a SockJS bridge will, by default refuse to let through any messages. It's up to you to tell the bridge what messages are ok for it to pass through. (There is an exception for reply messages which are always allowed through).

In other words the bridge acts like a kind of firewall which has a default __deny-all__ policy.

Configuring the bridge to tell it what messages it should pass through is easy. You pass in two Json arrays that represent matches, as arguments to `bridge`.

The first array is the `inbound` list and represents the messages that you want to allow through from the client to the server. The second array is the `outbound` list and represents the messages that you want to allow through from the server to the client.

Each match can have up to three fields: - `address`: This represents the exact address the message is being sent to. If you want to filter messages based on an exact address you use this field. - `address_re`: This is a regular expression that will be matched against the address. If you want to filter messages based on a regular expression you use this field. If the `address` field is specified this field will be ignored. - `match`: This allows you to filter messages based on their structure. Any fields in the match must exist in the message with the same values for them to be passed. This currently only works with JSON messages.

When a message arrives at the bridge, it will look through the available permitted entries.

* If an `address` field has been specified then the `address` must match exactly with the address of the message for it to be considered matched.
* If an `address` field has not been specified and an `address_re` field has been specified then the regular expression in `address_re` must match with the address of the message for it to be considered matched.
* If a `match` field has been specified, then also the structure of the message must match.

Here is an example:

    value server = vertx.createHttpServer();
    
    value config = Object { "prefix"->"/echo" };
    
    value inboundPermitted = new Array();
    
    // Let through any messages sent to 'demo.orderMgr'
    value inboundPermitted1 = JsonObject { "address"->"demo.orderMgr" };
    inboundPermitted.add(inboundPermitted1);
    
    // Allow calls to the address 'demo.persistor' as long as the messages
    // have an action field with value 'find' and a collection field with value
    // 'albums'
    value inboundPermitted2 = Object {
      "address"->"demo.persistor",
      "match"-> Object { "action"->"find", "collection"->"albums" }
    };
    inboundPermitted.add(inboundPermitted2);
    
    // Allow through any message with a field `wibble` with value `foo`.
    Object inboundPermitted3 = Object { "match"-> Object { "wibble"->"foo" } };
    inboundPermitted.add(inboundPermitted3);
    
    value outboundPermitted = Array();
    
    // Let through any messages coming from address 'ticker.mystock'
    value outboundPermitted1 = Object { "address"->"ticker.mystock" };
    outboundPermitted.add(outboundPermitted1);
    
    // Let through any messages from addresses starting with "news." (e.g. news.europe, news.usa, etc)
    value outboundPermitted2 = Object { "address_re"->"news\\..+" };
    outboundPermitted.add(outboundPermitted2);
    
    vertx.createSockJSBridge(server).bridge(config, inboundPermitted, outboundPermitted);
    
    server.listen(8080);
### Messages that require authorisation

The bridge can also refuse to let certain messages through if the user is not authorised.

To enable this you need to make sure an instance of the `vertx.auth-mgr` module is available on the event bus. (Please see the modules manual for a full description of modules).

To tell the bridge that certain messages require authorisation before being passed, you add the field `requires_auth` with the value of true in the match. The default value is `false`. For example, the following match:

    {
      address : 'demo.persistor',
      match : {
        action : 'find',
        collection : 'albums'
      },
      requires_auth: true
    }

This tells the bridge that any messages to save orders in the `orders` collection, will only be passed if the user is successful authenticated (i.e. logged in ok) first.

# SockJS - EventBus Bridge

## SockJS

WebSockets are a new technology, and many users are still using browsers that do not support them, or which support older, pre-final, versions.

Moreover, WebSockets do not work well with many corporate proxies. This means that's it's not possible to guarantee a WebSockets connection is going to succeed for every user.

Enter SockJS.

SockJS is a client side JavaScript library and protocol which provides a simple WebSocket-like interface to the client side JavaScript developer irrespective of whether the actual browser or network will allow real WebSockets.

It does this by supporting various different transports between browser and server, and choosing one at runtime according to browser and network capabilities. All this is transparent to you - you are simply presented with the WebSocket-like interface which __just works__.

Please see the [SockJS website](https://github.com/sockjs/sockjs-client) for more information.
### SockJS Server

Vert.x provides a complete server side SockJS implementation.

This enables Vert.x to be used for modern, so-called real-time (this is the modern meaning of real-time, not to be confused by the more formal pre-existing definitions of soft and hard real-time systems) web applications that push data to and from rich client-side JavaScript applications, without having to worry about the details of the transport.

To create a SockJS server you simply create a HTTP server as normal and then call the createSockJSServer method of your vertx instance passing in the Http server:

    value httpServer = vertx.createHttpServer();
    value sockJSServer = vertx.createSockJSServer(httpServer);

Each SockJS server can host multiple __applications__.

Each application is defined by some configuration, and provides a handler which gets called when incoming SockJS connections arrive at the server.

For example, to create a SockJS echo application:

    value httpServer = vertx.createHttpServer();
    
    value sockJSServer = vertx.createSockJSServer(httpServer);
    
    Object config = new Object { "prefix"->"/echo" };
    
    sockJSServer.installApp(config, (SockJSSocket sock) => Pump.createPump(sock, sock).start());
    
    httpServer.listen(8080);

The configuration is an instance of [`Object`](https://modules.ceylon-lang.org/repo/1/ceylon/json/1.1.0/module-doc/api/Object.type.html), which takes the following fields:

* `prefix`: A url prefix for the application. All http requests whose paths begins with selected prefix will be handled by the application. This property is mandatory.
* `insert_JSESSIONID`: Some hosting providers enable sticky sessions only to requests that have JSESSIONID cookie set. This setting controls if the server should set this cookie to a dummy value. By default setting JSESSIONID cookie is enabled. More sophisticated beaviour can be achieved by supplying a function.
* `session_timeout`: The server sends a `close` event when a client receiving connection have not been seen for a while. This delay is configured by this setting. By default the `close` event will be emitted when a receiving connection wasn't seen for 5 seconds.
* `heartbeat_period`: In order to keep proxies and load balancers from closing long running http requests we need to pretend that the connection is active and send a heartbeat packet once in a while. This setting controls how often this is done. By default a heartbeat packet is sent every 5 seconds.
* `max_bytes_streaming`: Most streaming transports save responses on the client side and don't free memory used by delivered messages. Such transports need to be garbage-collected once in a while. `max_bytes_streaming sets a minimum number of bytes that can be send over a single http streaming request before it will be closed. After that client needs to open new request. Setting this value to one effectively disables streaming and will make streaming transports to behave like polling transports. The default value is 128K.
* `library_url`: Transports which don't support cross-domain communication natively ('eventsource' to name one) use an iframe trick. A simple page is served from the SockJS server (using its foreign domain) and is placed in an invisible iframe. Code run from this iframe doesn't need to worry about cross-domain issues, as it's being run from domain local to the SockJS server. This iframe also does need to load SockJS javascript client library, and this option lets you specify its url (if you're unsure, point it to the latest minified SockJS client release, this is the default). The default value is `http://cdn.sockjs.org/sockjs-0.3.4.min.js`
### Reading and writing data from a SockJS server

The [`SockJSSocket`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/sockjs/SockJSSocket.type.html) object passed into the SockJS handler provides access to [`SockJSSocket.readStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/sockjs/SockJSSocket.type.html#readStream) and [`SockJSSocket.writeStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/sockjs/SockJSSocket.type.html#writeStream) much like WebSocket. You can therefore use the standard API for reading and writing to the SockJS socket or using it in pumps.

See the chapter on Streams and Pumps for more information.
### SockJS client

For full information on using the SockJS client library please see the SockJS website. A simple example:

    <script>
      var sock = new SockJS('http://mydomain.com/my_prefix');
    
      sock.onopen = function() {
        console.log('open');
      };
    
      sock.onmessage = function(e) {
        console.log('message', e.data);
      };
    
      sock.onclose = function() {
        console.log('close');
      };
    </script>

As you can see the API is very similar to the WebSockets API.
## SockJS - EventBus Bridge
### Setting up the Bridge

By connecting up SockJS and the Vert.x event bus we create a distributed event bus which not only spans multiple Vert.x instances on the server side, but can also include client side JavaScript running in browsers.

We can therefore create a huge distributed bus encompassing many browsers and servers. The browsers don't have to be connected to the same server as long as the servers are connected.

On the server side we have already discussed the event bus API.

We also provide a client side JavaScript library called `vertxbus.js` which provides the same event bus API, but on the client side.

This library internally uses SockJS to send and receive data to a SockJS Vert.x server called the SockJS bridge. It's the bridge's responsibility to bridge data between SockJS sockets and the event bus on the server side.

Creating a Sock JS bridge is simple. You just call the `bridge method on the SockJS server.

You will also need to secure the bridge (see below).

The following example bridges the event bus to client side JavaScript:

    value server = vertx.createHttpServer();
    
    value config = Object { "prefix"->"/eventbus" };
    
    Array noPermitted = Array();
    noPermitted.add(new JsonObject());
    
    vertx.createSockJSServer(server).bridge(config, noPermitted, noPermitted);
    
    server.listen(8080);

To let all messages through you can specify two JSON array with a single empty JSON object which will match all messages.

__Be very careful!__
### Using the Event Bus from client side JavaScript

Once you've set up a bridge, you can use the event bus from the client side as follows:

In your web page, you need to load the script `vertxbus.js`, then you can access the Vert.x event bus API. Here's a rough idea of how to use it. For a full working examples, please consult the vert.x examples.

    <script src="http://cdn.sockjs.org/sockjs-0.3.4.min.js"></script>
    <script src='vertxbus.js'></script>
    
    <script>
    
      var eb = new vertx.EventBus('http://localhost:8080/eventbus');
    
      eb.onopen = function() {
        eb.registerHandler('some-address', function(message) {
          console.log('received a message: ' + JSON.stringify(message);
        });
        eb.send('some-address', {name: 'tim', age: 587});
      }
    
    </script>

You can find `vertxbus.js` in the client directory of the Vert.x distribution.

The first thing the example does is to create a instance of the event bus

    var eb = new vertx.EventBus('http://localhost:8080/eventbus');

The parameter to the constructor is the URI where to connect to the event bus. Since we create our bridge with the prefix eventbus we will connect there.

You can't actually do anything with the bridge until it is opened. When it is open the `onopen` handler will be called.

The client side event bus API for registering and unregistering handlers and for sending messages is the same as the server side one. Please consult the chapter on the event bus for full information.

__There is one more thing to do before getting this working, please read the following section....__
### Securing the Bridge

If you started a bridge like in the above example without securing it, and attempted to send messages through it you'd find that the messages mysteriously disappeared. What happened to them?

For most applications you probably don't want client side JavaScript being able to send just any message to any verticle on the server side or to all other browsers.

For example, you may have a persistor verticle on the event bus which allows data to be accessed or deleted. We don't want badly behaved or malicious clients being able to delete all the data in your database! Also, we don't necessarily want any client to be able to listen in on any topic.

To deal with this, a SockJS bridge will, by default refuse to let through any messages. It's up to you to tell the bridge what messages are ok for it to pass through. (There is an exception for reply messages which are always allowed through).

In other words the bridge acts like a kind of firewall which has a default __deny-all__ policy.

Configuring the bridge to tell it what messages it should pass through is easy. You pass in two Json arrays that represent matches, as arguments to `bridge`.

The first array is the `inbound` list and represents the messages that you want to allow through from the client to the server. The second array is the `outbound` list and represents the messages that you want to allow through from the server to the client.

Each match can have up to three fields: - `address`: This represents the exact address the message is being sent to. If you want to filter messages based on an exact address you use this field. - `address_re`: This is a regular expression that will be matched against the address. If you want to filter messages based on a regular expression you use this field. If the `address` field is specified this field will be ignored. - `match`: This allows you to filter messages based on their structure. Any fields in the match must exist in the message with the same values for them to be passed. This currently only works with JSON messages.

When a message arrives at the bridge, it will look through the available permitted entries.

* If an `address` field has been specified then the `address` must match exactly with the address of the message for it to be considered matched.
* If an `address` field has not been specified and an `address_re` field has been specified then the regular expression in `address_re` must match with the address of the message for it to be considered matched.
* If a `match` field has been specified, then also the structure of the message must match.

Here is an example:

    value server = vertx.createHttpServer();
    
    value config = Object { "prefix"->"/echo" };
    
    value inboundPermitted = new Array();
    
    // Let through any messages sent to 'demo.orderMgr'
    value inboundPermitted1 = JsonObject { "address"->"demo.orderMgr" };
    inboundPermitted.add(inboundPermitted1);
    
    // Allow calls to the address 'demo.persistor' as long as the messages
    // have an action field with value 'find' and a collection field with value
    // 'albums'
    value inboundPermitted2 = Object {
      "address"->"demo.persistor",
      "match"-> Object { "action"->"find", "collection"->"albums" }
    };
    inboundPermitted.add(inboundPermitted2);
    
    // Allow through any message with a field `wibble` with value `foo`.
    Object inboundPermitted3 = Object { "match"-> Object { "wibble"->"foo" } };
    inboundPermitted.add(inboundPermitted3);
    
    value outboundPermitted = Array();
    
    // Let through any messages coming from address 'ticker.mystock'
    value outboundPermitted1 = Object { "address"->"ticker.mystock" };
    outboundPermitted.add(outboundPermitted1);
    
    // Let through any messages from addresses starting with "news." (e.g. news.europe, news.usa, etc)
    value outboundPermitted2 = Object { "address_re"->"news\\..+" };
    outboundPermitted.add(outboundPermitted2);
    
    vertx.createSockJSBridge(server).bridge(config, inboundPermitted, outboundPermitted);
    
    server.listen(8080);
### Messages that require authorisation

The bridge can also refuse to let certain messages through if the user is not authorised.

To enable this you need to make sure an instance of the `vertx.auth-mgr` module is available on the event bus. (Please see the modules manual for a full description of modules).

To tell the bridge that certain messages require authorisation before being passed, you add the field `requires_auth` with the value of true in the match. The default value is `false`. For example, the following match:

    {
      address : 'demo.persistor',
      match : {
        action : 'find',
        collection : 'albums'
      },
      requires_auth: true
    }

This tells the bridge that any messages to save orders in the `orders` collection, will only be passed if the user is successful authenticated (i.e. logged in ok) first.

# File System

## File System

Vert.x lets you manipulate files on the file system. File system operations are asynchronous and returns a promise. This promise will be resolved when the operation is complete, or an error has occurred.
### Synchronous forms

For convenience, we also provide synchronous forms of most operations. It's highly recommended the asynchronous forms are always used for real applications.

The synchronous form does not take a handler as an argument and returns its results directly. The name of the synchronous function is the same as the name as the asynchronous form with `Sync` appended.
### copy

Copies a file.

This function can be called in two different ways:

`copy(source, destination)`

Non recursive file copy. source is the source file name. destination is the destination file name. Here's an example:

    value promise = vertx.fileSystem.copy("foo.dat", "bar.dat");
    promise.onComplete(
       (Null n) => print("Copy was successful"),
       (Throwable t) => print("Failed to copy``t``")
    );

`copy(source, destination, recursive)`

Recursive copy. source is the source file name. destination is the destination file name. `recursive` is a boolean flag - if true and source is a directory, then a recursive copy of the directory and all its contents will be attempted.
### move

Moves a file.

`move(source, destination, handler)`

`source is the source file name.`destination` is the destination file name.
### truncate

Truncates a file.

`truncate(file, len, handler)`

`file` is the file name of the file to truncate. `len` is the length in bytes to truncate it to.
### chmod

Changes permissions on a file or directory. This function can be called in two different ways:

`chmod(file, perms)`

Change permissions on a file.

`file` is the file name. `perms` is a Unix style permissions string made up of 9 characters. The first three are the owner's permissions. The second three are the group's permissions and the third three are others permissions. In each group of three if the first character is `r` then it represents a read permission. If the second character is `w` it represents write permission. If the third character is `x` it represents execute permission. If the entity does not have the permission the letter is replaced with `-`. Some examples:

    rwxr-xr-x
    r--r--r--

`chmod(file, perms, dirPerms)`

Recursively change permissions on a directory. `file` is the directory name. `perms` is a Unix style permissions to apply recursively to any files in the directory. `dirPerms` is a Unix style permissions string to apply to the directory and any other child directories recursively.
### props

Retrieve properties of a file.

`props(file)`

`file is the file name. The props are returned in the handler. The results is an object with the following methods:

* [`FileProps.creationTime`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileProps.type.html#creationTime): Time of file creation.
* [`FileProps.lastAccessTime`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileProps.type.html#lastAccessTime): Time of last file access.
* [`FileProps.lastModifiedTime`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileProps.type.html#lastModifiedTime): Time file was last modified.
* [`FileProps.directory`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileProps.type.html#directory): This will have the value true if the file is a directory.
* [`FileProps.regularFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileProps.type.html#regularFile): This will have the value `true` if the file is a regular file (not symlink or directory).
* [`FileProps.symbolicLink`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileProps.type.html#symbolicLink): This will have the value `true` if the file is a symbolic link.
* [`FileProps.other`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileProps.type.html#other): This will have the value `true` if the file is another type.

Here's an example:

    value promise = vertx.fileSystem.props("foo.dat");
    promise.onComplete(
      (FileProps props) => print("Last accessed: `props.lastAccessTime`"),
      (Throwable err) => print("Failed to get props ``err`")
    );
### lprops

Retrieve properties of a link. This is like [`FileSystem.props`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileSystem.type.html#props) but should be used when you want to retrieve properties of a link itself without following it.

It takes the same arguments and provides the same results as [`FileSystem.props`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileSystem.type.html#props).
### link

Create a hard link.

`link(link, existing)`

`link` is the name of the link. `existing` is the existing file (i.e. where to point the link at).
### symlink

Create a symbolic link.

`symlink(link, existing)`

`link` is the name of the symlink. `existing` is the exsting file (i.e. where to point the symlink at).
### unlink

Unlink (delete) a link.

`unlink(link)`

`link` is the name of the link to unlink.
### readSymLink

Reads a symbolic link. I.e returns the path representing the file that the symbolic link specified by `link` points to.

`readSymLink(link)`

`link` is the name of the link to read. An usage example would be:

    value promise = vertx.fileSystem.readSymLink("somelink");
    promise.onComplete(
      (String s) => print("Link points at ``s``"),
      (Throwable err) => print("Failed to read ``err``")
    );   
### delete

Deletes a file or recursively deletes a directory.

This function can be called in two ways:

`delete(file)`

Deletes a file. `file` is the file name.

`delete(file, recursive)`

If `recursive` is `true`, it deletes a directory with name `file`, recursively. Otherwise it just deletes a file.
### mkdir

Creates a directory.

This function can be called in three ways:

`mkdir(dirname)`

Makes a new empty directory with name `dirname`, and default permissions `

`mkdir(dirname, createParents)`

If `createParents` is `true`, this creates a new directory and creates any of its parents too. Here's an example

    value promise = vertx.fileSystem.mkdir("a/b/c", true);
    promise.onComplete(
      (Null n) => print("Directory created ok"),
      (Throwable err) => print("Failed to mkdir ``err``")
    );

`mkdir(dirname, createParents, perms)`

Like `mkdir(dirname, createParents)`, but also allows permissions for the newly created director(ies) to be specified. `perms` is a Unix style permissions string as explained earlier.
### readDir

Reads a directory. I.e. lists the contents of the directory.

This function can be called in two ways:

`readDir(dirName)`

Lists the contents of a directory

`readDir(dirName, filter)` List only the contents of a directory which match the filter. Here's an example which only lists files with an extension `txt` in a directory.

    value promise = vertx.fileSystem.readDir("mydirectory", ".*\\.txt");
    promise.onComplete(
      ({String*} names) => print("Directory contains these .txt files: ``names``"),
      (Throwable err) => print("Failed to read ``err`")
    );

The filter is a regular expression.
### readFile

Read the entire contents of a file in one go. __Be careful if using this with large files since the entire file will be stored in memory at once.__

`readFile(file)`

Where `file` is the file name of the file to read.

The body of the file will be provided as an instance of `org.vertx.java.core.buffer.Buffer` by the promise.

Here is an example:

    value promise = vertx.fileSystem.readFile("myfile.dat");
    promise.onComplete(
      (Buffer buf) => print("File contains: ``buf.length()`` bytes"),
      (Throwable err) => print("Failed to read ``err`")
    );
### writeFile

Writes an entire `Buffer` or a string into a new file on disk.

`writeFile(file, data)`

Where `file` is the file name. `data` is a `Buffer` or string.
### createFile

Creates a new empty file.

`createFile(file)`

Where `file` is the file name.
### exists

Checks if a file exists.

`exists(file)`

Where `file` is the file name.

The result is provided by the promise.

    value promise = vertx.fileSystem.exists("some-file.txt");
    promise.onComplete(
      (Boolean b) => print("File " + ``b ? "exists" : "does not exist"``"),
      (Throwable err) => print("Failed to check existence ``err``")
    );
### fsProps

Get properties for the file system.

`fsProps(file)`

Where `file` is any file on the file system.

The result is provided by the promise. The result object is an instance of [`FileSystemProps`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileSystemProps.type.html) has the following methods:

* [`FileSystemProps.totalSpace`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileSystemProps.type.html#totalSpace): Total space on the file system in bytes.
* [`FileSystemProps.unallocatedSpace`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileSystemProps.type.html#unallocatedSpace): Unallocated space on the file system in bytes.
* [`FileSystemProps.usableSpace`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/FileSystemProps.type.html#usableSpace): Usable space on the file system in bytes.

Here is an example:

    value promise = vertx.fileSystem.fsProps("mydir");
    promise.onComplete(
      (FileSystemProps props) => print("total space: ``props.totalSpace``"),
      (Throwable err) => print("Failed to check existence ``err``")
    );
### open

Opens an asynchronous file for reading \ writing.

This function can be called in four different ways:

`open(file)`

Opens a file for reading and writing. `file` is the file name. It creates it if it does not already exist.

`open(file, perms)`

Opens a file for reading and writing. `file` is the file name. It creates it if it does not already exist and assigns it the permissions as specified by `perms`.

`open(file, perms, createNew)`

Opens a file for reading and writing. `file`is the file name. If `createNew` is `true` it creates it if it does not already exist.

`open(file, perms, read, createNew, write)`

Opens a file. `file` is the file name. If `read` is`true` it is opened for reading. If `write` is `true` it is opened for writing. If `createNew` is `true` it creates it if it does not already exist.

`open(file, perms, read, createNew, write, flush)`

Opens a file. `file` is the file name. If `read` is `true` it is opened for reading. If `write` is `true` it is opened for writing. If `createNew` is `true` it creates it if it does not already exist. If `flush` is `true` all writes are immediately flushed through the OS cache (default value of flush is `false`).

When the file is opened, an instance of [`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html) is provided by the promise:

    value promise = vertx.fileSystem.open("some-file.dat");
    promise.onComplete(
      (AsyncFile f) => print("File opened ok!"),
      (Throwable err) => print("Failed to open file ``err``")
    );
## AsyncFile

Instances of [`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html) are returned from calls to `open` and you use them to read from and write to files asynchronously. They allow asynchronous random file access.

[`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html) implements [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html) so you can pump files to and from other stream objects such as net sockets, http requests and responses, and WebSockets.

They also allow you to read and write directly to them.
### Random access writes

To use an [`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html) for random access writing you use the [`AsyncFile.write`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html#write) method.

`write(buffer, position)`

The parameters to the method are:

* `buffer`: the buffer to write.
* `position`: an integer position in the file where to write the buffer. If the position is greater or equal to the size of the file, the file will be enlarged to accomodate the offset.

Here is an example of random access writes:

    vertx.fileSystem.open("some-file.dat").onComplete {
      void onFulfilled(AsyncFile file) {
        // File open, write a buffer 5 times into a file
        value buff = Buffer("foo");
        for (i in 0..5) {
          value promise = asyncFile.write(buff, buff.length() * i);
          promise.onComplete(
            (Null n) => print("Written ok!"),
            (Throwable err) => print("Failed to write  ``err``")
          );
      },
      void onRejected(Throwable err) {
        print("Failed to write  ``err``");
      }
    };
### Random access reads

To use an [`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html) for random access reads you use the [`AsyncFile.read`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html#read) method.

`read(buffer, offset, position, length)`.

The parameters to the method are:

* `buffer`: the buffer into which the data will be read.
* `offset`: an integer offset into the buffer where the read data will be placed.
* `position`: the position in the file where to read data from.
* `length`: the number of bytes of data to read

Here's an example of random access reads:

    vertx.fileSystem.open("some-file.dat").onComplete {
      void onFulfilled(AsyncFile file) {
        // File open, write a buffer 5 times into a file
        value buff = Buffer(1000);
        for (i in 0..10) {
          value promise = file.read(buff, i * 100, 100);
          promise.onComplete(
            (Null n) => print("Read ok!"),
            (Throwable err) => print("Failed to read  ``err``")
          );
      },
      void onRejected(Throwable err) {
        print("Failed to read  ``err``");
      }
    };

If you attempt to read past the end of file, the read will not fail but it will simply read zero bytes.
### Flushing data to underlying storage.

If the [`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html) was not opened with `flush = true`, then you can manually flush any writes from the OS cache by calling the [`AsyncFile.flush`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html#flush) method.

This method can also be called with an handler which will be called when the flush is complete.
### Using AsyncFile as ReadStream and WriteStream

[`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html) implements [`ReadStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/ReadStream.type.html) and [`WriteStream`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/stream/WriteStream.type.html). You can then use them with a pump to pump data to and from other read and write streams.

Here's an example of pumping data from a file on a client to a HTTP request:

    value client = vertx.createHttpClient { host = "foo.com" };
    
    vertx.fileSystem.open("some-file.dat").onComplete {
      void onFulfilled(AsyncFile file) {
        value request = client.put("/uploads");
        request.response.onComplete((HttpClientResponse resp) => print("Received response: ``resp.statusCode``") );
        request.chunked = true;
        value pump = file.readStream.pump(request.stream);
        pump.start();
        file.readStream.endHandler(request.end); // File sent, end HTTP request
      },
      void onRejected(Throwable err) {
        print(""Failed to open file ``err``");
      }
    };   
### Closing an AsyncFile

To close an [`AsyncFile`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html) call the [`AsyncFile.close`](https://modules.ceylon-lang.org/repo/1/io/vertx/ceylon/core/1.0.0/module-doc/api/file/AsyncFile.type.html#close) method. Closing is asynchronous and if you want to be notified when the close has been completed you can use the returned promise.

