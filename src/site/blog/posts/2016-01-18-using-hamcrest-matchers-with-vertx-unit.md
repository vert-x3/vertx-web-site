---
title: Using Hamcrest Matchers with Vert.x Unit
template: post.html
date: 2016-01-18
author: cescoffier
---

Vert.x Unit is a very elegant library to test asynchronous applications developed with vert.x. However because of this asynchronous aspect, reporting test failures is not natural for JUnit users.  This is because, the failed assertions need to be reported to the _test context_, controlling the execution (and so the outcome) of the test. In other words, in a Vert.x Unit test you cannot use the regular Junit assertions and assertion libraries. In this blog post, we propose a way to let you using Hamcrest matchers in Vert.x Unit tests.

## Using Vert.x Unit

Vert.x Unit is a test library made to ensure the behavior of vert.x applications. It lets you implement tests checking asynchronous behavior.

Vert.x Unit can be used with Junit. For this, you just need to add the following dependency to your project:

```xml
<dependency>
  <groupId>io.vertx</groupId>
  <artifactId>vertx-unit</artifactId>
  <version>3.2.0</version>
  <scope>test</scope>
</dependency>
```

If you are using Gradle, the dependency is:
```
testCompile ‘io.vertx:vertx-unit:3.2.0’
```

If you are using an IDE, just add the vertx-unit jar to your project classpath.

Obviously, you would need to add JUnit too.

Notice that vertx-unit does not need JUnit, and can be used without it. Check the Vert.x Unit [documentation](http://vertx.io/docs/vertx-unit/java/) for more details.


## Vert.x Unit example

Let’s consider this very simple `Verticle`:

```java
public class MyFirstVerticle extends AbstractVerticle {

  @Override
  public void start(final Future future) throws Exception {
    vertx.createHttpServer()
        .requestHandler(req -> req.response().end("hello vert.x"))
        .listen(8080, done -> {
          if (done.failed()) {
            future.fail(done.cause());
          } else {
            future.complete();
          }
        });
  }
}
```

It just creates a new HTTP server and when launched it notifies the `future` of the completion.

To test this verticle with Vert.x Unit you would write something like:

```java
@RunWith(VertxUnitRunner.class)
public class MyFirstVerticleTest {

  private Vertx vertx;

  @Before
  public void setUp(TestContext context) {
    vertx = Vertx.vertx();
    vertx.deployVerticle(MyFirstVerticle.class.getName(),
      context.asyncAssertSuccess());
  }

  @Test
  public void test(TestContext context) {
    Async async = context.async();
    vertx.createHttpClient().get(8080, "localhost", "/")
      .handler(response -> {
        context.assertEquals(200, response.statusCode());
        response.bodyHandler(buffer -> {
          context.assertEquals("hello vert.x", buffer.toString("utf-8"));
          async.complete();
        });
      })
      .end();
  }
}
```

First, the test class is annotated with `@RunWith(VertxUnitRunner.class)`, instructing JUnit to use this special runner. This runner lets you inject a `TestContext` parameter into every test methods (as well as `@Before` and `@After`) to handle the asynchronous aspect of the test.

In the `setUp` method, it creates a new instance of `Vertx` and deploy the verticle. Thanks to `context.asyncAssertSuccess()`, it waits until the successful completion of the verticle deployment. Indeed, the deployment is asynchronous, and we must be sure that the verticle has been deployed and has completed its initialization before starting to test it.

The `test()` method creates an `Async` object that will be used to report when the test has been completed. Then it creates an HTTP client to emit a request on the server from our verticle and check that:

1. the HTTP code is `200 (OK)`
2. the body is `hello vert.x`

As you can see, to implement the checks, the assertions method are called on the `TestContext` object, which control the test execution. When everything has been tested, we call `async.complete()` to end the test. If an assertion failed, the test is obviously stopped. This would not be the case if you would use regular Junit assertions.

## Using the Hamcrest Matchers

In the previous example, we used the the assertions available from the `TestContext` instance. However it provides a limited set of methods. Hamcrest is a library of matchers, which can be combined in to create flexible expressions of intent in tests. It is very convenient when testing complex applications.

Hamcrest cannot be used directly as it would not report the failure on the `TestContext`. For this purpose we create a `VertxMatcherAssert` class:

```java
public class VertxMatcherAssert {

  public static <T> void assertThat(TestContext context, T actual,
    Matcher<? super T> matcher) {
    assertThat(context, "", actual, matcher);
  }

  public static <T> void assertThat(TestContext context, String reason,
    T actual, Matcher<? super T> matcher) {
    if (!matcher.matches(actual)) {
      Description description = new StringDescription();
      description.appendText(reason)
          .appendText("\nExpected: ")
          .appendDescriptionOf(matcher)
          .appendText("\n     but: ");
      matcher.describeMismatch(actual, description);
      context.fail(description.toString());
    }
  }

  public static void assertThat(TestContext context, String reason,
    boolean assertion) {
    if (!assertion) {
      context.fail(reason);
    }
  }
}
```

This class provides `assertThat` method that reports error on the given `TestContext`. The complete code is available [here](https://gist.github.com/cescoffier/5cbf4c69aa094ac9b1a6).

With this class, we can re-implement our test as follows:

```java
@Test
public void testWithHamcrest(TestContext context) {
  Async async = context.async();
  vertx.createHttpClient().get(8080, "localhost", "/").handler(response -> {
    assertThat(context, response.statusCode(), is(200));
    response.bodyHandler(buffer -> {
      assertThat(context, buffer.toString("utf-8"), is("hello vert.x"));
      async.complete();
    });
  }).end();
}
```

To ease the usage, I've added two _import static_:

```java
import static io.vertx.unit.example.VertxMatcherAssert.assertThat;
import static org.hamcrest.core.Is.is;
```

You can use any Hamcrest matcher, or even implement your own as soon as you use the `assertThat` method provided by `VertxMatcherAssert`.

## Conclusion

In this post we have seen how you can combine Hamcrest and Vert.x Unit. So, you are not limited anymore by the set of assert methods provided by Vert.x Unit, and can use the whole expressiveness of Hamcrest Matchers.

Don’t forget that you still can’t use the `assert` methods from Junit, as they don’t report on the `TestContext`.
