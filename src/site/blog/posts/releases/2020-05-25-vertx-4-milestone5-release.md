---
title: Eclipse Vert.x 4 milestone 5 released!
date: 2020-06-10
template: post.html
author: vietj
draft: true
---

We are extremely pleased to announce the fifth 4.0 milestone release of Eclipse Vert.x .

Vert.x 4 is the evolution of the Vert.x 3.x series that will bring key features to Vert.x.

This release aims to provide a reliable distribution of the current development of Vert.x 4 for people that
want to try it and provide feedback.

#### New kids on the block: Json Schema, Web Validation and Web OpenAPI

we decide to take HTTP request validation in `vertx-web` and Contract Driven development using [OpenAPI](https://github.com/OAI/OpenAPI-Specification)
to a next level in Vert.x 4, allow us to introduce:

* [Vert.x Json Schema](https://github.com/eclipse-vertx/vertx-json-schema): Extensible sync/async json-schema validator designed for Vert.x JSON types, supporting Json Schema Draft-7 and OpenAPI dialect.
* [Vert.x Web Validation](https://github.com/vert-x3/vertx-web/tree/master/vertx-web-validation): Extensible sync/async HTTP request validator, providing a DSL to describe expected HTTP requests.
* [Vert.x Web OpenAPI](https://github.com/vert-x3/vertx-web/tree/master/vertx-web-openapi): New support for Contract Driven development based on OpenAPI

Vert.x Json Schema is a powerful [Json Schema](https://json-schema.org/) validator which includes:

* Async `$ref` resolution
* Custom keywords/Custom dialects support
* A DSL to build schemas

Combining Vert.x Json Schema and Vert.x Web Validation you can easily validate HTTP requests:

```java
ValidationHandler handler = ValidationHandler
  .builder(schemaParser)
  .pathParameter(Parameters.param("myPathParam", stringSchema()))
  .queryParameter(Parameters.optionalParam("myQueryParam", intSchema()))
  .body(Bodies.json(Schemas.ref(JsonPointer.fromURI(URI.create(
    "some_schema.json"
  )))))
  .build();

router.post("/{myPathParam}").handler(handler);
```

Check out the [Web validation examples](https://github.com/vert-x3/vertx-web/blob/master/vertx-web-validation/src/main/java/examples/WebValidationExamples.java) and provide feedback on the APIs!

Vert.x Web Validation allows you to use Vert.x Web API Service without Vert.x Web API Contract:
[Vert.x Web API Service example](https://github.com/vert-x3/vertx-web/tree/master/vertx-web-api-service/src/main/java/examples)

You can achieve Contract Driven development, with Vert.x Web OpenAPI:

```java
RouterFactory.create(vertx, "src/main/resources/petstore.yaml",
  routerFactoryAsyncResult -> {
  if (routerFactoryAsyncResult.succeeded()) {
    // Spec loaded with success, retrieve the router
    RouterFactory routerFactory = routerFactoryAsyncResult.result();
    // You can enable or disable different features of router factory using RouterFactoryOptions
    RouterFactoryOptions options = new RouterFactoryOptions();
    // Set the options
    routerFactory.setOptions(options);
    // Add an handler to operation listPets
    routerFactory.operation("listPets").handler(routingContext -> {
      // Handle listPets operation
      routingContext.response().setStatusMessage("Called listPets").end();
    }).failureHandler(routingContext -> { // Add a failure handler to the same operation
      // This is the failure handler
      Throwable failure = routingContext.failure();
      if (failure instanceof BadRequestException)
        // Handle Validation Exception
        routingContext
          .response()
          .setStatusCode(400)
          .putHeader("content-type", "application/json")
          .end(((BadRequestException)failure).toJson().toBuffer());
    });

    // Add a security handler
    // Handle security here
    routerFactory.securityHandler(
      "api_key",
      JWTAuthHandler.create(jwtAuth)
    );

    // Now you have to generate the router
    Router router = routerFactory.createRouter();
  } else {
    // Something went wrong during router factory initialization
  }
});
```

Vert.x Web OpenAPI is the new way to do Vert.x Web API Contract, however Vert.x Web API Contract remains supported
for the whole lifetime of Vert.x 4 to provide a migration path: we will provide soon a migration guide for Vert.x Web API Contract.

Check out the [Web OpenAPI examples](https://github.com/vert-x3/vertx-web/blob/master/vertx-web-openapi/src/main/java/examples/OpenAPI3Examples.java)

#### SQL Client templates

SQL Client Templates is a small library designed to facilitate the execution of SQL queries.

Simply put you execute prepared SQL queries with a map instead of a tuple:

```java
Map<String, Object> parameters = Collections.singletonMap("id", 1);

SqlTemplate
  .forQuery(client, "SELECT * FROM users WHERE id=#{id}")
  .execute(parameters)
  .onSuccess(users -> {
    users.forEach(row -> {
      System.out.println(row.getString("first_name") + " " + row.getString("last_name"));
    });
  });
```

A template can perform tuple to object mapping for parameters and rows.

Here is row mapping using Jackson Databind.

```java
SqlTemplate
  .forQuery(client, "SELECT * FROM users WHERE id=#{id}")
  .mapTo(User.class)
  .execute(Collections.singletonMap("id", 1))
  .onSuccess(users -> {
    users.forEach(user -> {
      System.out.println(user.firstName + " " + user.lastName);
    });
  });
```

You can also uses Vert.x data objects to generate mappers instead: when a data object is annotate with `@RowMapped` a row mapper
function will be generated

```java
@DataObject
@RowMapped
class User {
  ...
}

// Generated by SQL template code generator
class UserRowMapper implements java.util.function.Function<io.vertx.sqlclient.Row, User> {
  ...
}
```

You can then use this mapper instead of `User.class`

```java
SqlTemplate
  .forQuery(client, "SELECT * FROM users WHERE id=#{id}")
  .mapTo(UserRowMapper.INSTANCE)
  .execute(Collections.singletonMap("id", 1))
  .onSuccess(users -> {
    users.forEach(user -> {
      System.out.println(user.firstName + " " + user.lastName);
    });
  });
```

#### A new clustering SPI

This milestone introduces the clustering SPI redesign that allows to:

- simplify both Vert.x core and cluster manager implementations
- leverage capabilities of some cluster managers (e.g. data loss protection)

Read the [RFC](https://github.com/vert-x3/wiki/wiki/RFC:-clustering-SPI-revisited) document if you would like to know more.

As a developer, you should not see much difference, the EventBus and Shared data API remain unchanged.

However, if you operate a cluster in production, you cannot mix Vert.x 3 and Vert.x 4 nodes.

The following cluster managers implementations have been updated: [`vertx-hazelcast`](https://vertx.io/docs/vertx-hazelcast/java/), [`vertx-infinispan`](https://vertx.io/docs/vertx-infinispan/java/) and [`vertx-iginite`](https://vertx.io/docs/vertx-ignite/java/) (thanks [Lukas Prettenthaler](https://github.com/zyclonite) for your help).
The [`vertx-zookeeper`](https://vertx.io/docs/vertx-zookeeper/java/) update will be available in the next release.

#### Upgrade to Infinispan 10 and Ignite 2.8.0

Following-up on the clustering SPI update :

- the Infinispan cluster manager now depends on Infinispan 10
- the Apache Ignite cluster manager on 2.8.0

#### Complete refactoring on vertx-auth authn/authz split

Authentication has been decoupled from authorization, all modules now implement at least one of the two interfaces:

* `AuthenticationProvider`
* `AuthorizationProvider`

This improvement provides more flexiblity such as user authentication using a property file and authorization against a database.

This milestone also includes a few new implementations:

* `vertx-auth-ldap` supersedes `shiro`
* `vertx-authproperties` supersedes `shiro`
* `vertx-auth-sql` to use `sql-client`s as source of user data
* `vertx-auth-webauthn` provides `FIDO2` `webauthn` authentication

Many bug fixes have been done and missing features such as `JWK` rotation support for `OAuth2/OIDC`/`JWT` is now implemented.

#### Vertx-web updates

Vert.x-Web also got some updates.

The session handler code now allows other storages:

* `cookie-session-store` - stores all session data in a cookie
* `redis-session-store` - store all session data in a redis key store database

Sessions follows the latest OWASP recommendations and allows to now use `cookieless` sessions, where the session key is passed in the URL.

Routers are now proxy aware: when enabled, routers can parse the `Forward` headers and rebind the internal values
for protocol, host and port for user convinience. This is quite useful when applications are deployed behind
a caching server, which can modify the original request.

#### JUnit 5 support updates

The `vertx-junit5` module has had the following updates since the last milestone.

* [The internals have been refactored](https://github.com/vert-x3/wiki/wiki/4.0.0-Deprecations-and-breaking-changes#split-the-core-implementation-and-extensions) to split the implementation and extensions around a service-provider interface.
  While this is largely transparent in terms of API, you need to be aware that:
  * the Vertx parameter should be placed before any parameter that requires it for creation, such as when injecting a WebClient,
  * the vertx-junit5 module now only offers APIs for the Vert.x core module (vertx-core),
  * the [reactiverse-junit5-extensions module](https://github.com/reactiverse/reactiverse-junit5-extensions) now hosts extensions that offer extra parameter types like WebClient,
  * the RxJava 1 and 2 bindings are now offered as vertx-junit5-rx-java and vertx-junit5-rx-java2 modules in the vertx-junit5-extensions repository.
* The `succeeding()` and `failing()` methods in `VertxTestContext` have been deprecated to improve ergonomics, you should instead use `succeedingThenComplete()` and `failingThenComplete()`.

#### Ramping up to Vert.x 4

Instead of developing all new features exclusively in Vert.x 4, we introduce some of these features in the 3.x branch
so the community can benefit from them. The Vert.x 4 development focus on more fundamental changes that cannot be done
in the 3.x series.

<img src="{{ site_url }}assets/blog/vertx-4-milestone4-release/vertx-4-timeline.png" alt="Screenshot" class="img-responsive">

This is the fifth milestone of Vert.x 4, you can of course expect more milestones to outline the progress of the effort.

You can also read the previous milestone announces:

- https://vertx.io/blog/eclipse-vert-x-4-milestone-4-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-3-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-2-released
- https://vertx.io/blog/eclipse-vert-x-4-milestone-1-released

#### Finally

The [deprecations and breaking changes](https://github.com/vert-x3/wiki/wiki/4.0.0-Deprecations-and-breaking-changes)
 can be found on the wiki.

The release artifacts have been deployed to [Maven Central](https://search.maven.org/search?q=g:io.vertx%20AND%20v:4.0.0-milestone5) and you can get the distribution on [Maven Central](https://repo1.maven.org/maven2/io/vertx/vertx-stack-manager/4.0.0-milestone5/).

You can bootstrap a Vert.x 4.0.0-milestone5 project using https://start.vertx.io.

The documentation has been deployed on this preview web-site https://vertx-ci.github.io/vertx-4-preview/docs/

That's it! Happy coding and see you soon on our user or dev [channels](https://vertx.io/community).
