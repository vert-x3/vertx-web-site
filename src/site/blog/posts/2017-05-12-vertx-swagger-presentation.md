---
title: Presentation of the Vert.x-Swagger project
template: post.html
date: 2017-05-22
author: phiz71
---

This post is an introduction to the [Vert.x-Swagger] project, and describe how to use the `Swagger-Codegen` plugin and the `SwaggerRouter` class.

## Eclipse Vert.x & Swagger
[Vert.x][vertx-core] and [Vert.x Web][vert.x-web] are very convenient to write REST API and especially the [Router] which is very useful to manage all resources of an API.

But when I start a new API, I usually use the "design-first" approach and [Swagger] is my best friend to define what my API is supposed to do. And then, comes the "boring" part of the job : convert the swagger file content into java code. That's always the same : resources, operations, models...

Fortunately, Swagger provides a codegen tool : [Swagger-Codegen]. With this tool, you can generate a server stub based on your swagger definition file. 
However, even if this generator provides many different languages and framework, Vert.X is missing.

This is where the [Vert.x-Swagger] project comes in.

## The project
**Vert.x-Swagger** is a maven project providing 2 modules.

### vertx-swagger-codegen
It's a [Swagger-Codegen] plugin, which add the capability of generating a Java Vert.x WebServer to the generator.

The generated server mainly contains :
 * POJOs for `definitions`
 * one Verticle per `tag`
 * one MainVerticle, which manage others APIVerticle and start an HttpServer.

[NOTE the MainVerticle use *vertx-swagger-router*]

### vertx-swagger-router
The main class of this module is `SwaggerRouter`. It's more or less a *Factory* (and maybe I should rename the class) that can create a [Router][router], using the swagger definition file to configure all the routes. For each route, it extracts parameters from the request (`Query`, `Path`, `Header`, `Body`, `Form`) and send them on the eventBus, using either the `operationId` as the address or a computed id (just a parameter in the constructor).

## Let see how it works
[INFO For this post, I will use a simplified swagger file but you can find a more complex example [here][petstore-vertx-sample] based on the [petstore] swagger file]
### Generating the server
First, choose your swagger definition. Here's a YAML File, but it could be a JSON file :
<script src="https://gist.github.com/phiz71/6c654f3da2d4124d3fe65e5aaaaedf55.js"></script>

Then, download these libraries :
 * [swagger-codegen-cli]
 * [vertx-swagger-codegen]

Finally, run this command
```bash
java -cp /path/to/swagger-codegen-cli-2.2.2.jar:/path/to/vertx-swagger-codegen-1.0.0.jar io.swagger.codegen.SwaggerCodegen generate \
  -l java-vertx \
  -o path/to/destination/folder \
  -i path/to/swagger/definition \
  --group-id your.group.id \
  --artifact-id your.artifact.id
```

[INFO For more Information about how SwaggerCodegen works | you can read this https://github.com/swagger-api/swagger-codegen#getting-started]

You should have something like that in your console:
```
[main] INFO io.swagger.parser.Swagger20Parser - reading from ./wineCellarSwagger.yaml
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/src/main/java/io/swagger/server/api/model/Bottle.java
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/src/main/java/io/swagger/server/api/model/CellarInformation.java
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/src/main/java/io/swagger/server/api/verticle/BottlesApi.java
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/src/main/java/io/swagger/server/api/verticle/BottlesApiVerticle.java
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/src/main/java/io/swagger/server/api/verticle/InformationApi.java
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/src/main/java/io/swagger/server/api/verticle/InformationApiVerticle.java
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/src/main/resources/swagger.json
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/src/main/java/io/swagger/server/api/MainApiVerticle.java
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/src/main/resources/vertx-default-jul-logging.properties
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/pom.xml
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/README.md
[main] INFO io.swagger.codegen.AbstractGenerator - writing file [path/to/destination/folder]/.swagger-codegen-ignore
```
And this in your destination folder:

![Generated sources](/assets/blog/vertx-swagger-presentation/GeneratedProject.png)

### What have been created ?
As you can see in **1**,  the *vertx-swagger-codegen* plugin has created one POJO by `definition` in the swagger file.
#### Example : the bottle definition 
<script src="https://gist.github.com/phiz71/eabafda440b24881126089128d677121.js"></script>

In **2a** and **2b** you can find :
 * an interface which contains a function per `operation`
 * a verticle which defines all `operationId` and create [EventBus] consumers 

#### Example : the Bottles interface
<script src="https://gist.github.com/phiz71/be1ca2f550f44aea7fb2710b383e26ed.js"></script>

#### Example : the Bottles verticle
<script src="https://gist.github.com/phiz71/c0aadbb4f26ebed8e2e145d0b4a8d210.js"></script>

### ... and now ?
Line `23` of `BottlesApiVerticle.java`, you can see this
```java
BottlesApi service = new BottlesApiImpl();
```
This line will not compile until the `BottlesApiImpl` class is created.

In all **XXXAPI**Verticles, you will find a variable called *service*. It is a **XXXAPI** type and it is instanciated with a **XXXAPI**Impl contructor. This class does not exist yet since it is the business of your API.

**And so you will have to create these implementations.**



## Fine, but what if I don't want to build my API like this ?
Well, Vert.x is **unopinionated** but the way the *vertx-swagger-codegen* creates the server stub **is not**. 
So if you want to implement your API the way you want, while enjoying dynamic routing based on a swagger file, the *vertx-swagger-router* library can be used standalone. 

Just import this jar into your project :
<script src="https://gist.github.com/phiz71/56e723362a1d1370c7262bff246fb087.js"></script>

You will be able to create your [Router] like this :
```java
FileSystem vertxFileSystem = vertx.fileSystem();
vertxFileSystem.readFile("***YOUR_SWAGGER_FILE***", readFile -> {
    if (readFile.succeeded()) {
        Swagger swagger = new SwaggerParser().parse(readFile.result().toString(Charset.forName("utf-8"))); 
        Router swaggerRouter = SwaggerRouter.swaggerRouter(Router.router(vertx), swagger, vertx.eventBus(), new OperationIdServiceIdResolver());
        [...]
   } else {
        [...]
   }
});
```
[NOTE You can ignore the last parameter in `SwaggerRouter.swaggerRouter(...)`. As a result, addresses will be computed instead of using `operationId` from the swagger file. 
For instance, `GET /bottles/{bottle_id}` will become *GET_bottles_bottle-id*]

## Conclusion
Vert.x and Swagger are great tools to build and document an API but using both in the same project can be painful. The [Vert.x-Swagger] project was made to save time, letting the developers focusing on business code.
It can be seen as an API framework over Vert.X.

You can also use the `SwaggerRouter` in your own project without using Swagger-Codegen.

In future releases, more information from the swagger file will be used to configure the router and certainly others languages will be supported.

[NOTE Though Vert.x is polyglot, Vert.x-Swagger project only supports Java. If you want to contribute to support more languages, you're welcome :) ] 

Thanks for reading.

<style type="text/css">
  .gist-file
  .gist-data {max-height: 500px}
</style>

[vertx-core]: http://vertx.io/docs/vertx-core/java/
[eventbus]: http://vertx.io/docs/vertx-core/java/#_the_event_bus_api
[vert.x-web]: http://vertx.io/docs/vertx-web/java/
[router]: http://vertx.io/docs/apidocs/io/vertx/ext/web/Router.html
[swagger]: http://swagger.io/specification/
[swagger-codegen]: https://github.com/swagger-api/swagger-codegen
[swagger-codegen-cli]: http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.2/swagger-codegen-cli-2.2.2.jar
[vert.x-swagger]: https://github.com/phiz71/vertx-swagger
[vertx-swagger-codegen]: http://central.maven.org/maven2/com/github/phiz71/vertx-swagger-codegen/1.0.0/vertx-swagger-codegen-1.0.0.jar
[petstore-vertx-sample]: https://github.com/phiz71/vertx-swagger/tree/master/sample/petstore-vertx-server
[petstore]: http://petstore.swagger.io/