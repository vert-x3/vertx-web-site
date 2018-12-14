---
title: Vert.x Web API Service Introduction
template: post.html
date: 2018-12-13
author: slinkydeveloper
---

# Vert.x Web API Service

Vert.x 3.6 introduces a new module called `vertx-web-api-service`. With the new Web API Services you can easily combine the [Vert.x Web Router](https://vertx.io/docs/vertx-web/java/) and the [Vert.x OpenAPI Router Factory](https://vertx.io/docs/vertx-web-api-contract/java/) features with [Vert.x Services on Event Bus](https://vertx.io/docs/vertx-service-proxy/java/).

## Small recap on OpenAPI and Vert.x Web API Contract

Let's start from this OpenAPI definition:

```yaml
openapi: 3.0.0
paths:
  /api/transactions:
    get:
      operationId: getTransactionsList
      description: Get transactions list filtered by sender
      x-vertx-event-bus: transactions_manager.myapp
      parameters:
        - name: from
          in: query
          description: Matches exactly the email from
          style: form
          explode: false
          schema:
            type: array
            items:
              type: string
      responses: ...
    post:
      operationId: addTransaction
      x-vertx-event-bus: transactions_manager.myapp
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Transaction"
      responses: ...
  /api/transactions/{transactionId}:
    parameters:
      - name: transactionId
        in: path
        required: true
        schema:
          type: string
    put:
      operationId: updateTransaction
      x-vertx-event-bus: transactions_manager.myapp
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Transaction"
      responses: ...
    delete:
      operationId: removeTransaction
      x-vertx-event-bus: transactions_manager.myapp
      responses: ...
components:
  schemas:
    Transaction: ...
    Error: ...
```

We defined `getTransactionsList`, `addTransaction`, `updateTransaction` and `removeTransaction` operations. Now with `OpenAPI3RouterFactory` we create a `Router` that accepts this various operation requests:

```java
OpenAPI3RouterFactory.create(vertx, "src/main/resources/petstore.yaml", ar -> {
  if (ar.succeeded()) {
    // Spec loaded with success
    OpenAPI3RouterFactory routerFactory = ar.result();
    routerFactory.addHandlerByOperationId("getTransactionsList", routingContext -> {
      RequestParameters params = routingContext.get("parsedParameters");
      RequestParameter from = params.queryParameter("from");
      // getTransactionsList business logic
    });
    // add handlers for addTransaction, updateTransaction and removeTransaction
    Router router = routerFactory.getRouter();
  } else {
    // Something went wrong during router factory initialization
    Throwable exception = ar.cause();
    // Log exception, fail verticle deployment ... etc
  }
});
```

The `OpenAPI3RouterFactory` provides an easy way to create a specification compliant `Router`, but it doesn't provide a mechanism to decouple the business logic from your operation handlers.

In a typical Vert.x application, when you receive a request to your router, you would forward it to an event bus endpoint that performs some actions and sends the result back to the operation handler.

Vert.x Web API Service simplifies that integration between `RouterFactory` and `EventBus` with a new code generator. The final result is a _loose coupling_ between the Web Router logic and your business logic.

## Let's get started with Vert.x Web Api Services!

To use `vertx-web-api-service` you need to add a couple of dependencies to your project. In a Maven POM file that would be:

```xml
<dependency>
  <groupId>io.vertx</groupId>
  <artifactId>vertx-codegen</artifactId>
  <version>3.6.0</version>
  <classifier>processor</classifier>
</dependency>
<dependency>
  <groupId>io.vertx</groupId>
  <artifactId>vertx-web-api-service</artifactId>
  <version>3.6.0</version>
</dependency>
```

We will proceed in this order:

1. Model the service interface
2. Rewrite it to work with Web Api Services
3. Implement the service
4. Mount the service on the event bus
5. Use the router factory to build a router with handlers that connects to our event bus services

## Model your service

Let's say that we want to model a service that manages all operations regarding CRUD transactions. An example interface for this asynchronous service could be:

```java
public interface TransactionsManagerService {
  void getTransactionsList(List<String> from, Handler<AsyncResult<List<Transaction>>> resultHandler);
  void addTransaction(Transaction transaction, Handler<AsyncResult<Transaction>> resultHandler);
  void updateTransaction(String transactionId, Transaction transaction, Handler<AsyncResult<Transaction>> resultHandler);
  void removeTransaction(String transactionId, Handler<AsyncResult<Integer>> resultHandler);
}
```

For each operation, we have some parameters, depending on the operation, and a callback (`resultHandler`) that should be called when the operation succeeds or fails.

With [Vert.x Service Proxy](https://vertx.io/docs/vertx-service-proxy/java/), you can define an event bus service with a Java interface similar to the one we just saw and then annotate it with `@ProxyGen`. This annotation will generate a _service handler_ for the defined service that can be plugged to the event bus with `ServiceBinder`. `vertx-web-api-service` works in a very similar way: you need to annotate the Java interface with `@WebApiServiceGen` and it will generate the service handler for the event bus.

Let's rewrite the `TransactionsManagerService` to work with Web API Service:

```java
import io.vertx.ext.web.api.*;
import io.vertx.ext.web.api.generator.WebApiServiceGen;

@WebApiServiceGen
public interface TransactionsManagerService {
  void getTransactionsList(List<String> from, OperationRequest context, Handler<AsyncResult<OperationResponse>> resultHandler);
  void addTransaction(Transaction body, OperationRequest context, Handler<AsyncResult<OperationResponse>> resultHandler);
  void updateTransaction(String transactionId, Transaction body, OperationRequest context, Handler<AsyncResult<OperationResponse>> resultHandler);
  void removeTransaction(String transactionId, OperationRequest context, Handler<AsyncResult<OperationResponse>> resultHandler);

  // Factory method to instantiate the implementation
  static TransactionsManagerService create(Vertx vertx) {
    return new TransactionsManagerServiceImpl(vertx);
  }
}

```

First of all, look at the annotation `@WebApiServiceGen`. This annotation will trigger the code generator that generates the event bus handler for this service. Each method has the same two last parameters:

* `OperationRequest context`: this data object contains the headers and the parameters of the HTTP request
* `Handler<AsyncResult<OperationResponse>> resultHandler`: this callback accepts an `OperationResponse` data object that will encapsulate the body of the result, the status code, the status message and the headers

The generated handler receives only the `OperationRequest` data object and extracts from it all operation parameters. For example, when the router receives a request at `getTransactionsList`, it sends to `TransactionsManagerService` the `OperationRequest` containing the `RequestParameters` map. From this map, the service generated handler extracts the `from` parameter. 

Therefore **operation parameters names should match method parameter names**.

When you want to extract the body you must use `body` keyword. For more details, please refer to the [documentation](https://vertx.io/docs/vertx-web-api-service/java/).

## Implement the service

Now that you have your interface, you can implement the service:

```java
public class TransactionsManagerServiceImpl implements TransactionsManagerService {

  private Vertx vertx;

  public TransactionsManagerServiceImpl(Vertx vertx) {  this.vertx = vertx;  }

  @Override
  public void getTransactionsList(List<String> from, OperationRequest context, Handler<AsyncResult<OperationResponse>> resultHandler){
    // Write your business logic here
    resultHandler.handle(Future.succeededFuture(OperationResult.completedWithJson(resultJson)));
  }

  // Implement other operations

}
```

Check the `OperationResult` documentation to look at various handy methods to create a complete response.

## Mount the Service

Now that you have your service interface and implementation, you can mount your service with `ServiceBinder`:

```java
ServiceBinder serviceBinder = new ServiceBinder(vertx);

TransactionsManagerService transactionsManagerService = TransactionsManagerService.create(vertx);
registeredConsumers.add(
  serviceBinder
    .setAddress("transactions_manager.myapp")
    .register(TransactionsManagerService.class, transactionsManagerService)
);
```

## And the Router Factory?

The service is up and running, but we need to connect it to the `Router` built by `OpenAPI3RouterFactory`:

```java
OpenAPI3RouterFactory.create(this.vertx, "my_spec.yaml", openAPI3RouterFactoryAsyncResult -> {
  if (openAPI3RouterFactoryAsyncResult.succeeded()) {
    OpenAPI3RouterFactory routerFactory = openAPI3RouterFactoryAsyncResult.result();
    // Mount services on event bus based on extensions
    routerFactory.mountServicesFromExtensions(); // <- Pure magic happens!
    // Generate the router
    Router router = routerFactory.getRouter();
    server = vertx.createHttpServer(new HttpServerOptions().setPort(8080));
    server.requestHandler(router).listen();
    // Initialization completed
  } else {
    // Something went wrong during router factory initialization
  }
});
```

In our spec example we added an extension `x-vertx-event-bus` to each operation that specifies the address of the service. Using this extension, you only need to call `OpenAPI3RouterFactory.mountServicesFromExtensions()` to trigger a scan of all operations and mount all found service addresses. For each operation that contains `x-vertx-event-bus`, the Router Factory instantiates an handler that routes the incoming requests to the address you specified.

This is one of the methods you can use to match services with router operation handlers. Check the documentation for all details.

## More examples

Check out the complete example in [vertx-examples repo](https://github.com/vert-x3/vertx-examples/tree/master/web-api-service-example).

Thanks you for your time, stay tuned for more updates! And please provide feedback about this new package!
