---
title: Send web requests and assert results with vertx-junit5-web-client
date: 2019-10-22
template: post.html
author: slinkydeveloper
---

In last Vert.x 3.8 release we added a new module called `vertx-junit5-web-client`, that brings [Vert.x Web Client](https://vertx.io/docs/vertx-web-client/java/) injection
into tests and provides an API called `TestRequest` to simplify the creation and assertions on `WebClient` requests:

```
import static io.vertx.junit5.web.TestRequest.*;

@ExtendWith({
  VertxExtension.class, // VertxExtension MUST be configured before VertxWebClientExtension
  VertxWebClientExtension.class
})
public class TestRequestExample {

  @Test
  public void test1(WebClient client, VertxTestContext testContext) {
    testRequest(client, HttpMethod.GET, "/hello") // Build the request
      .with(
        queryParam("name", "francesco"), // Add query param
        requestHeader("x-my", "foo") // Add request header
      )
      .expect(
        // Assert that response is a JSON with a specific body
        jsonBodyResponse(new JsonObject().put("value", "Hello Francesco!")),
        // Assert that response contains a particular header
        responseHeader("x-my", "bar")
      )
      .send(testContext); // Complete (or fail) the VertxTestContext
  }

}
```

`testRequest()` will use Vert.x Web Client to send the request. When the response is received, It succeds the test or it correctly propagates assertion failures, if any.

You can also send multiple requests using [`Checkpoint`](https://vertx.io/docs/apidocs/io/vertx/junit5/Checkpoint.html):

```
import static io.vertx.junit5.web.TestRequest.*;

@ExtendWith({
  VertxExtension.class, // VertxExtension MUST be configured before VertxWebClientExtension
  VertxWebClientExtension.class
})
public class MultiTestRequestExample {

  @Test
  public void test2(WebClient client, VertxTestContext testContext) {
    Checkpoint checkpoint = testContext.checkpoint(2); // Create the Checkpoint to flag when request succeds

    testRequest(
        client    // Create the test request using WebClient APIs
          .get("/hello")
          .addQueryParam("name", "francesco")
          .putHeader("x-my", "foo")
      )
      .expect(
        jsonBodyResponse(new JsonObject().put("value", "Hello Francesco!")),
        responseHeader("x-my", "bar")
      )
      .send(testContext, checkpoint); // Pass the checkpoint to flag

    testRequest(
        client
          .get("/hello")
          .addQueryParam("name", "julien")
          .putHeader("x-my", "foo")
      )
      .expect(
        jsonBodyResponse(new JsonObject().put("value", "Hello Julien!")),
        responseHeader("x-my", "bar")
      )
      .send(testContext, checkpoint);
  }

}
```

Look at [Vert.x JUnit 5 Web Client documentation](https://vertx.io/docs/vertx-junit5-web-client/java/) for more details
