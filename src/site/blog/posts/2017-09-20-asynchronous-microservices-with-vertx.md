---
title: Asynchronous Microservices with Vert.x
template: post.html
date: 2017-09-20
author: piomin
---

An introduction paragraph that will be use as _except_ in the RSS feed.

## Asynchronous Microservices with Vert.x

### Preface

I must admit that as soon as I saw Vert.x documentation I liked this concept. This may have happened because I had previously use with very similar framework which I used to create simple and lightweight applications exposing REST APIs – Node.js. It is really fine framework, but has one big disadvantage for me – it is JavaScript runtime. What is worth mentioning Vert.x is polyglot, it supports all the most popular JVM based languages like Java, Scala, Groovy, Kotlin and even JavaScript. These are not all of its advantages. It’s lightweight, fast and modular. I was pleasantly surprised when I added the main Vert.x dependencies to my `pom.xml` and there was not downloaded many of other dependencies, as is often the case when using Spring Boot framework.
Well, I will not elaborate about the advantages and key concepts of this toolkit. I think you can read more about it in other articles. The most important thing for us is that using Vert.x we can can create high performance and asynchronous microservices based on Netty framework. In addition, we can use standardized microservices mechanisms such as service discovery, configuration server or circuit breaking.

Sample application source code is available on [Github](https://github.com/piomin/sample-vertx-microservices.git). It consists of two modules account-vertx-service and customer-vertx-service. Customer service retrieves data from Consul registry and invokes acccount service API. Architecture of the sample solution is visible on the figure below.

!(/assets/blog/asynchronous-microservices-with-vertx/vertx.png)

### Building services

To be able to create HTTP service exposing REST API we need to include the following dependency into `pom.xml`.

```
<dependency>
	<groupId>io.vertx</groupId>
	<artifactId>vertx-web</artifactId>
	<version>${vertx.version}</version>
</dependency>
```

Here’s the fragment from account service where I defined all API methods. The first step (1) was to declare `Router` which is one of the core concepts of Vert.x-Web. A router takes an HTTP request, finds the first matching route for that request, and passes the request to that route. The next step (2), (3) is to add some handlers, for example `BodyHandler`, which allows you to retrieve request bodies and has been added to POST method. Then we can begin to define API methods (4), (5), (6), (7), (8). And finally (9) we are starting HTTP server on the port retrieved from configuration.

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

### Verticles

It is worth to mention a few words about running an application written in Vert.x. It is based on verticles. Verticles are chunks of code that get deployed and run by Vert.x. A Vert.x instance maintains N event loop threads by default. When creating a verticle we have to extend abstract class `AbstractVerticle`.

```
public class AccountServer extends AbstractVerticle {
 
	@Override
	public void start() throws Exception {
	    ...
	}
}
```

I created two verticles per microservice. First for HTTP server and second for communication with Mongo. Here’s main application method where I’m deploying verticles.

```
public static void main(String[] args) throws Exception {
	Vertx vertx = Vertx.vertx();
	vertx.deployVerticle(new MongoVerticle());
	vertx.deployVerticle(new AccountServer());
}
```

Well, now we should obtain the reference inside AccountServer verticle to the service running on MongoVerticle. To achieve it we have to generate proxy classes using `vertx-codegen` module.

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

First, annotate repository interface with `@ProxyGen` ad all public methods with `@Fluent`.

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

Generator needs additional configuration inside `pom.xml` file. After running command `mvn clean install` on the parent project all generated classes should be available under `src/main/generated` directory for every microservice module.

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
	    <annotationProcessors>        <annotationProcessor>io.vertx.codegen.CodeGenProcessor</annotationProcessor>
	    </annotationProcessors>
	    <generatedSourcesDirectory>${project.basedir}/src/main/generated</generatedSourcesDirectory>
	    <compilerArgs>
        	<arg>-AoutputDirectory=${project.basedir}/src/main</arg>
	    </compilerArgs>
	</configuration>
</plugin>
```

Now we are able to obtain `AccountRepository` reference by calling `createProxy` with account-service name.

```
AccountRepository repository = AccountRepository.createProxy(vertx, "account-service");
```

### Service Discovery

To use the Vert.x service discovery, we have to add the following dependencies into `pom.xml`. In the first of them there are mechanisms for built-in Vert.x discovery, which is rather not usable if we would like to invoke microservices running on different hosts. Fortunately, there are also available some additional bridges, for example Consul bridge.

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

Once the account-service have registered itself on discovery server we can invoke it from another microservice – in this case from customer-service. We only have to create `ServiceDiscovery` object and register Consul service importer.

```
ServiceDiscovery discovery = ServiceDiscovery.create(vertx);
...
discovery.registerServiceImporter(new ConsulServiceImporter(), new JsonObject().put("host", discoveryConfig.getString("host")).put("port", discoveryConfig.getInteger("port")).put("scan-period", 2000));
```

Here’s `AccountClient` fragment, which is responsible for invoking GET /account/customer/{customerId} from account-service. It obtains service reference from discovery object and cast it to `WebClient` instance. I don’t know if you have noticed that apart from the standard fields such as `ID`, `Name` or `Port`, I also set the Tags field to the value of the type of service that we register. In this case it will be an http-endpoint. Whenever Vert.x reads data from Consul, it will be able to automatically assign a service reference to `WebClient` object.

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

### Config

For configuration management within the application Vert.x Config module is responsible.

```
<dependency>
    <groupId>io.vertx</groupId>
    <artifactId>vertx-config</artifactId>
    <version>${vertx.version}</version>
</dependency>
```

There are many configuration stores, which can be used as configuration data location:
*File
*Environment Variables
*HTTP
*Event Bus
*Git
*Redis
*Consul
*Kubernetes
*Spring Cloud Config Server

Final Thoughts

Vert.x authors wouldn’t like to define their solution as a framework, but as a tool-kit. They don’t tell you what is a correct way to write an application, but only give you a lot of useful bricks helping to create your app. With Vert.x you can create fast and lightweight APIs basing on non-blocking, asynchronous I/O. It gives you a lot of possibilities, as you can see on the Config module example, where you can even use Spring Cloud Config Server as a configuration store. But it is also not free from drawbacks, as I showed on the service registration with Consul example. Vert.x also allows to create reactive microservices with RxJava, what seems to be interesting option, I hope to describe in the future. For more please refer to my post available on <https://piotrminkowski.wordpress.com/2017/08/24/asynchronous-microservices-with-vert-x/>. There is also newest post about security with Vert.x and OAuth2 [ Building Secure APIs with Vert.x and OAuth2](https://piotrminkowski.wordpress.com/2017/09/15/building-secure-apis-with-vert-x-and-oauth2/).