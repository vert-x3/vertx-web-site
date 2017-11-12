---
title: Asynchronous Microservices with Vert.x
template: post.html
date: 2017-11-10
author: piomin
---

[NOTE this is a re-publication of the following [Blog post](https://piotrminkowski.wordpress.com/2017/08/24/asynchronous-microservices-with-vert-x/)]

## Asynchronous Microservices with Eclipse Vert.x

### Preface

I must admit that as soon as I saw Vert.x documentation I liked it. This may have happened because I had previously
used a very similar framework to create simple and lightweight applications exposing REST APIs in Node.js. Node is great
, but in my opinion it has one important drawback: it is JavaScript runtime.

Vert.x is polyglot, it supports all the most popular JVM based languages like Java, Scala, Groovy, Kotlin and even
JavaScript. In addition, Vert.x is lightweight, fast and modular. I was pleasantly surprised when I added
the main Vert.x dependencies to my `pom.xml` and the number of downloaded dependencies downloaded was quite small,
unlike other frameworks.

Well, I will not elaborate more about the advantages and key concepts of this tool-kit, you can read more about it in
other articles. The most important thing being that with Vert.x we can can create high performance and asynchronous
microservices based on Netty framework.

In addition, we can create microservices with service discovery, configuration server or circuit breakers.

Sample application source code is available on [Github](https://github.com/piomin/sample-vertx-microservices.git).
It consists of two modules _account-vertx-service_ and _customer-vertx-service_. Customer service retrieves data from
Consul registry and invokes the acccount service API:

!(/assets/blog/asynchronous-microservices-with-vertx/vertx.png)

### Building services

To build our HTTP service exposing a REST API we need to add the following dependency to `pom.xml`.

```
<dependency>
	<groupId>io.vertx</groupId>
	<artifactId>vertx-web</artifactId>
	<version>${vertx.version}</version>
</dependency>
```

Here's the snippet from account service where I defined all API methods.

```
Router router = Router.router(vertx); // (1)
router.route("/account/*").handler(ResponseContentTypeHandler.create()); // (2)
router.route(HttpMethod.POST, "/account").handler(BodyHandler.create()); // (3)
router.get("/account/:id").produces("application/json").handler(rc -> { // (4)
	repository.findById(rc.request().getParam("id"), res -> {
	    Account account = res.result();
	    LOGGER.info("Found: {}", account);
	    rc.response().end(account.toString());
	});
});
router.get("/account/customer/:customer").produces("application/json").handler(rc -> { // (5)
	repository.findByCustomer(rc.request().getParam("customer"), res -> {
	    List<Account> accounts = res.result();
	    LOGGER.info("Found: {}", accounts);
	    rc.response().end(Json.encodePrettily(accounts));
	});
});
router.get("/account").produces("application/json").handler(rc -> { // (6)
	repository.findAll(res -> {
	    List<Account> accounts = res.result();
	    LOGGER.info("Found all: {}", accounts);
	    rc.response().end(Json.encodePrettily(accounts));
	});
});
router.post("/account").produces("application/json").handler(rc -> { // (7)
	Account a = Json.decodeValue(rc.getBodyAsString(), Account.class);
	repository.save(a, res -> {
	    Account account = res.result();
	    LOGGER.info("Created: {}", account);
	    rc.response().end(account.toString());
	});
});
router.delete("/account/:id").handler(rc -> { // (8)
	repository.remove(rc.request().getParam("id"), res -> {
	    LOGGER.info("Removed: {}", rc.request().getParam("id"));
	    rc.response().setStatusCode(200);
	});
});
...
vertx.createHttpServer().requestHandler(router::accept).listen(conf.result().getInteger("port")); // (9)
```

We start by declaring a `Router` (1) a core concepts of Vert.x-Web: a router takes an HTTP request, finds the first
matching route for that request, and passes the request to that route.

Then we add a couple of handlers, (2) and (2), for example `BodyHandler`, which allows you to retrieve request bodies
and has been added to _POST_ method.

Then we define API methods (4), (5), (6), (7), (8).

Finally (9) we start HTTP server on the port retrieved from configuration.

### Verticles

Vert.x applications are based on Verticles which are chunks of code that get deployed and run by Vert.x.

A Vert.x instance maintains `N` event loop threads by default.

Verticles are created by extending `AbstractVerticle`.

```
public class AccountServer extends AbstractVerticle {
 
	@Override
	public void start() throws Exception {
	    ...
	}
}
```

I created two verticles per microservice: the first Verticle creates the HTTP server and the second one communicates with Mongo.

These verticles are deployed by a java `main` method:

```
public static void main(String[] args) throws Exception {
	Vertx vertx = Vertx.vertx();
	vertx.deployVerticle(new MongoVerticle());
	vertx.deployVerticle(new AccountServer());
}
```

The `AccountServer` verticle will use a proxy to interact with the `MongoVerticle` service.

To achieve this we will use Vert.x [service proxies](http://vertx.io/docs/vertx-service-proxy/java/).

We need to add the `vertx-service-proxy` dependency to our build:

```
<dependency>
	<groupId>io.vertx</groupId>
	<artifactId>vertx-service-proxy</artifactId>
	<version>${vertx.version}</version>
</dependency>
<dependency>
	<groupId>io.vertx</groupId>
	<artifactId>vertx-codegen</artifactId>
	<version>${vertx.version}</version>
	<scope>provided</scope>
</dependency>
```

Then we annotate the `AccountRepository` interface with `@ProxyGen` to generate the proxy.

We also design our interface to be fluent using the `@Fluent` annotation, that provides a more elegant and concise
way to use the service:

```
@ProxyGen
public interface AccountRepository {
 
    @Fluent
    AccountRepository save(Account account, Handler<AsyncResult<Account>> resultHandler);
 
    @Fluent
    AccountRepository findAll(Handler<AsyncResult<List<Account>>> resultHandler);
 
    @Fluent
    AccountRepository findById(String id, Handler<AsyncResult<Account>> resultHandler);
 
    @Fluent
    AccountRepository findByCustomer(String customerId, Handler<AsyncResult<List<Account>>> resultHandler);
 
    @Fluent
    AccountRepository remove(String id, Handler<AsyncResult<Void>> resultHandler);
 
    static AccountRepository createProxy(Vertx vertx, String address) {
        return new AccountRepositoryVertxEBProxy(vertx, address);
    }
 
    static AccountRepository create(MongoClient client) {
        return new AccountRepositoryImpl(client);
    }
 
}
```

The code needs additional configuration inside `pom.xml` file.

```
<plugin>
	<groupId>org.apache.maven.plugins</groupId>
	<artifactId>maven-compiler-plugin</artifactId>
	<version>3.6.2</version>
	<configuration>
	    <encoding>${project.build.sourceEncoding}</encoding>
	    <source>${java.version}</source>
	    <target>${java.version}</target>
	    <useIncrementalCompilation>false</useIncrementalCompilation>
	    <annotationProcessors>
	      <annotationProcessor>io.vertx.codegen.CodeGenProcessor</annotationProcessor>
	    </annotationProcessors>
	    <generatedSourcesDirectory>${project.basedir}/src/main/generated</generatedSourcesDirectory>
	    <compilerArgs>
        	<arg>-AoutputDirectory=${project.basedir}/src/main</arg>
	    </compilerArgs>
	</configuration>
</plugin>
```

After running command `mvn clean install` on the parent project all generated classes should be
available under `src/main/generated` directory for every microservice module.

Now our client can create an `AccountRepository` proxy by calling `createProxy` with the _account-service_ name.

```
AccountRepository repository = AccountRepository.createProxy(vertx, "account-service");
```

### Service Discovery

To use the Vert.x service discovery, we need to add the following dependencies to our `pom.xml`.

We use the discovery API that along with the Consul bridge.

```
<dependency>
	<groupId>io.vertx</groupId>
	<artifactId>vertx-service-discovery</artifactId>
	<version>${vertx.version}</version>
</dependency>
<dependency>
	<groupId>io.vertx</groupId>
	<artifactId>vertx-service-discovery-bridge-consul</artifactId>
	<version>${vertx.version}</version>
</dependency>
```

When the _account-service_ has been registered to the discovery server we can invoke it from another microservice,
in our case from _customer-service_.

We create a `ServiceDiscovery` and register the Consul service importer.

```
ServiceDiscovery discovery = ServiceDiscovery.create(vertx);
...
discovery.registerServiceImporter(
  new ConsulServiceImporter(),
  new JsonObject()
    .put("host", discoveryConfig.getString("host"))
    .put("port", discoveryConfig.getInteger("port"))
    .put("scan-period", 2000)
);
```

The `AccountClient` invokes invoking the _/account/customer/{customerId}_ from the _account-service_:

```
public AccountClient findCustomerAccounts(String customerId, Handler<AsyncResult<List<Account>>> resultHandler) {
    discovery.getRecord(r -> r.getName().equals("account-service"), res -> {
        LOGGER.info("Result: {}", res.result().getType());
        ServiceReference ref = discovery.getReference(res.result());
        WebClient client = ref.getAs(WebClient.class);
        client.get("/account/customer/" + customerId).send(res2 -> {
            LOGGER.info("Response: {}", res2.result().bodyAsString());
            List<Account> accounts = res2.result().bodyAsJsonArray().stream().map(it -> Json.decodeValue(it.toString(), Account.class)).collect(Collectors.toList());
            resultHandler.handle(Future.succeededFuture(accounts));
        });
    });
    return this;
}
```

The service reference is given by the Service Discovery as a `WebClient` instance.

Beside the standard fields such as `ID`, `Name` or `Port`, we set the `Tags` field to the type of the registred service: an _http-endpoint_.

When the Service Discovery browses Consul, it assigns a service reference to a `WebClient`.

### Config

Vert.x Config takes care of the configuration management.

```
<dependency>
    <groupId>io.vertx</groupId>
    <artifactId>vertx-config</artifactId>
    <version>${vertx.version}</version>
</dependency>
```

There are different configuration stores:

* File
* Environment Variables
* HTTP
* Event Bus
* Git
* Redis
* Consul
* Kubernetes
* Spring Cloud Config Server

### TL;DR

Vert.x is not a traditional framework, it is rather a tool-kit.

It does not tells or force you how to you to write your application, but rather give you a lot of useful bricks to create your app.

You can create fast and lightweight APIs basing on non-blocking, asynchronous I/O.

The Vert.x stack gives you plenty of choice, such as the Config module but it could have been Spring Cloud Config Server as a configuration store.

But it is also not free from drawbacks, as I showed on the service registration with
Consul example.

Interestingly, Vert.x also allows to create reactive microservices with RxJava, that I hope to cover in the future.
