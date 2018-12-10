---
title: HTTP response validation with the Vert.x Web Client
template: post.html
date: 2018-12-10
author: tsegismont
--- 

By default, a [Vert.x Web Client](/docs/vertx-web-client/java/) request ends with an error only if something wrong happens at the network level.
In other words, a `404 Not Found` response, or a response with the wrong content type, are **not** considered as failures.

Hence, you would usually perform sanity checks manually after the response is received:

```
client
  .get(8080, "myserver.mycompany.com", "/some-uri")
  .send(ar -> {
    if (ar.succeeded()) {
      HttpResponse<Buffer> response = ar.result();
      if (response.statusCode() == 200 && response.getHeader("content-type").equals("application/json")) {
        // Decode the body as a json object
        JsonObject body = response.bodyAsJsonObject();
      } else {
        System.out.println("Something went wrong " + response.statusCode());
      }
    } else {
      System.out.println("Something went wrong " + ar.cause().getMessage());
    }
  });
```

Starting with [Vert.x 3.6](/blog/eclipse-vert-x-3-6-0-released/), you can can trade flexibility for clarity and conciseness using _response predicates_.

## Response predicates

[Response predicates](/docs/apidocs/io/vertx/ext/web/client/predicate/ResponsePredicate.html) can fail a request when the response does not match criterion.

The Web Client module comes with a set of ready-to-use predicates:

```
client
  .get(8080, "myserver.mycompany.com", "/some-uri")
  .expect(ResponsePredicate.SC_SUCCESS)
  .expect(ResponsePredicate.JSON)
  .send(ar -> {
    if (ar.succeeded()) {
      HttpResponse<Buffer> response = ar.result();
      // Safely decode the body as a json object
      JsonObject body = response.bodyAsJsonObject();
    } else {
      System.out.println("Something went wrong " + ar.cause().getMessage());
    }
  });

```

The web is full of HTTP/JSON endpoints, so there is no doubt the `ResponsePredicate.SC_SUCCESS` and `ResponsePredicate.JSON` can be handy.

Nevertheless, you might also need to check that the status code is whithin a specific range:

```
client
  .get(8080, "myserver.mycompany.com", "/some-uri")
  .expect(ResponsePredicate.status(200, 202))
  .send(ar -> {
    // ....
  });
```

Or that the content is of a specific type: 

```
client
  .get(8080, "myserver.mycompany.com", "/some-uri")
  .expect(ResponsePredicate.contentType("some/content-type"))
  .send(ar -> {
    // ....
  });
```

Please refer to the [`ResponsePredicate` documentation](/docs/apidocs/io/vertx/ext/web/client/predicate/ResponsePredicate.html) for a full list of predefined predicates.

### Custom predicates

Eventually, predicates were not designed for status code and content type checking only, so feel free to create your own validation code:

```
// Check CORS header allowing to do POST
Function<HttpResponse<Void>, ResponsePredicateResult> methodsPredicate = resp -> {
  String methods = resp.getHeader("Access-Control-Allow-Methods");
  if (methods != null) {
    if (methods.contains("POST")) {
      return ResponsePredicateResult.success();
    }
  }
  return ResponsePredicateResult.failure("Does not work");
};

// Send pre-flight CORS request
client
  .request(HttpMethod.OPTIONS, 8080, "myserver.mycompany.com", "/some-uri")
  .putHeader("Origin", "Server-b.com")
  .putHeader("Access-Control-Request-Method", "POST")
  .expect(methodsPredicate)
  .send(ar -> {
    if (ar.succeeded()) {
      // Process the POST request now
    } else {
      System.out.println("Something went wrong " + ar.cause().getMessage());
    }
  });
```

Note that response predicates are evaluated *before* the response body is received.
Therefore **you can't inspect the response body** in a predicate test function, only status code, status message and response headers.

## Dealing with failures

By default, response predicates (including the predefined ones) use a generic error converter which discards the response body and conveys a simple message.
You can customize the exception class by changing the error converter:

```
ResponsePredicate predicate = ResponsePredicate.create(ResponsePredicate.SC_SUCCESS, result -> {
  return new MyCustomException(result.message());
});
```

Beware that creating exceptions in Java comes with the **performance cost** of capturing the call stack.
The generic error converter generates exceptions that do not capture it.

### Reading details in error responses

Many web APIs provide details in error responses.
For example, the [Marvel API](https://developer.marvel.com/docs) uses this JSON object format:

```
{
  "code": "InvalidCredentials",
  "message": "The passed API key is invalid."
}
```

To avoid losing this information, it is possible to wait for the response body to be fully received before the error converter is called:

```
ErrorConverter converter = ErrorConverter.createFullBody(result -> {

  // Invoked after the response body is fully received
  HttpResponse<Buffer> response = result.response();

  if (response.getHeader("content-type").equals("application/json")) {
    // Error body is JSON data
    JsonObject body = response.bodyAsJsonObject();
    return new MyCustomException(body.getString("code"), body.getString("message"));
  }

  // Fallback to defaut message
  return new MyCustomException(result.message());
});

ResponsePredicate predicate = ResponsePredicate.create(ResponsePredicate.SC_SUCCESS, converter);
```

That's it! Feel free to comment here or ask questions on our [community channels](/community).
