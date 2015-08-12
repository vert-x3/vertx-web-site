---
title: Introduction to asynchronous APIs
template: post.html
author: cescoffier
date: 2015-08-12
draft: true
---

Asynchronous / non-blocking is one of the core characteristics of Vert.x. However, if you never saw such kind of API in action, it may look a bit strange. This post explains how asynchronous API works and the main entities used by Vert.x to design these APIs. This post also shows how blocking operations can become non-blocking, and the different steps of the migration.

This post is not about how Vert.x works, and just mentions briefly the thread model proposed by Vert.x. This post is about the asynchronous APIs, what’s the different with the traditional APIs, how can you use Vert.x `Handlers` and `AsyncResults`, the different code patterns you are going to see when using Vert.x, how to chain operations...

The code developed in this post is available on this Github project (TODO).


## Step 0 - We need an example

To explain how asynchronous API works, we need a concrete use case. Let’s say you want to compute the MD5 checksum of a message. Don’t worry, we won’t implement this algorithm, but use Apache Commons Codec for it (it’s not the topic of this post).

So let’s imagine this interface:

```java
public interface MD5 {
  String md5(String message);
}
```

This interface is a traditional, let’s say, _blocking interface_.  Someone calling this method is _blocked_ until the method returns:

```java
MD5 instance = ...;
String checksum = instance.md5("Hello");
System.out.println(checksum);
```
Let's see how this interface can become asynchronous.

## Step 1 - Don’t block the caller thread

If the computation takes a very long time, the thread is blocked until the result have been computed. Asynchronous API proposed a way to turn around this behavior. The method executes its business logic (the md5 computation) in another thread to not block the caller thread. Some time later, when the result has been computed, it invokes a _callback_ to provide the result.  So, let’s try to implement this. First, the interface needs to be slightly changed:

```java
public interface MD5 {
  interface Callback {
    void onComputationCompleted(String result);
  }
  void md5(String message, Callback retriever);
}
```

The first difference is the _returned_ type. It is `void`, as the method does not return anything anymore, but provides the result through a _callback_. The implementation of the `md5` method creates a new thread (or submit a job to an executor service) and when the computation is completed, it invokes the given `callback` with the result:

```java
public void md5(String message, Callback callback) {
  new Thread(() -> {
    String result = DigestUtils.md5Hex(message);
    callback.onComputationCompleted(result);
  }).start();
}
```

To use this method, you give a `Callback` object. Fortunately, Java 8 lambdas make this really easy:

```java
MD5 instance = ...;
instance.md5("Hello", result -> {
  System.out.println(result);
});
```

## Step 2 – Using Vert.x Handler

Well, as you can imagine, creating callback classes can become tiring very quickly. Fortunately, Vert.x provides an interface named `Handler`, that can replace our `Callback` interface. The `Handler` interface takes a generic parameter indicating the type of result to expect. By using this class, the `MD5` interface becomes:

```java
public interface MD5 {
  void md5(String message, Handler<String> resultHandler);
}
```

As our method computes a `String`, we use `Handler<String>`. The implementation does not change much:

```java
public void md5(String message, Handler<String> resultHandler) {
  new Thread(() -> {
    String result = DigestUtils.md5Hex(message);
    resultHandler.handle(result);
  }).start();
}
```

Instead of invoking the callback, it calls the `handle` method of the given `Handler`.

[NOTE What about method not returning anything? | Sometime asynchronous operations do not compute anything and don’t have a result to provide. In this case use `Handler<Void>` and `handler.handler(null)`.]

## Step 3 – The vert.x way

The two last versions have spawned new threads and invoke a `Handler` to provide the result. Vert.x provides a way to implement this behavior in a much more elegant way:

* No new threads - Vert.x uses its background (called _worker_) threads
* The method called to provide the result is called in the _event loop_ used by the caller.

This requires a bit more explanations. Vert.x manages two types of threads: the _event loop_ threads and the _worker_ threads. The event loop threads are used for everything which is non blocking. It must **never** be blocked. Vert.x maintains a very low number of event loop threads, but as they are never blocked (I repeat, they must be **never** blocked), they can handle a massive amount of work. Worker threads are made for blocking tasks or taks taking a long time to execute.

Let’s use vert.x features to implement our asynchronous md5 computation. Vert.x proposes the `executeBlocking` method that executes long/blocking operations in a background thread and injects the result by invoking a callback. The method takes two handlers as parameter. The first one wraps the business logic code (our md5 computation). It takes a `future` object as parameter which is used to indicate when the operation has been completed (by calling `future.complete(result)`). The second handler calls the result handler (our callback):

```java
public void md5(String message, Handler<String> resultHandler) {
  vertx.<String>executeBlocking(
      future -> {
        String result = DigestUtils.md5Hex(message);
        future.complete(result);
      },
      asyncResult -> resultHandler.handle(asyncResult.result())
  );
}
```

Unlike the previous examples, the callback is going to be called in the event loop thread used by the caller of the `md5` method. The second handler receives an `AsyncResult` wrapping the result.

[NOTE Am I on an event loop? | The previous code requires that the caller is on an event loop. You can check whether or not you are on an event loop using `Context.isOnEventLoopThread()`. If you are developing a regular verticle, you are probably on the event loop. If you are embedding Vert.x, you can execute code on the event loop using `vertx.runOnContext`.]

## Step 4 – Using Asynchronous Results

As you can see, the second handler of the `executeBlocking` method receives an `AsyncResult` as parameter. What is this? If you already use Vert.x, you may have noticed that `AsyncResult` is used all over the place. This structure not only wraps the computed result, but also an _exception_ if something wrong happens during the computation. Let’s use this structure. First we need to modify the MD5 interface. Instead of a `Handler<String>`, the `md5` method receives a `Handler<AsyncResult<String>>`:

```java
void md5(String message, Handler<AsyncResult<String>> resultHandler);
```

In the implementation, the only difference is about the callback invocation. We don't need to unwrap the result anymore, we can just call the `handle` method:

```java
public void md5(String message,
  Handler<AsyncResult<String>> resultHandler) {

  vertx.executeBlocking(
      future -> {
        String result = DigestUtils.md5Hex(message);
        future.complete(result);
      },
      resultHandler::handle
  );
}
```

This code used a method reference (`resultHandler::handle`). This is equivalent to `ar -> resultHandler.handle(ar)`.

The caller code is slightly different from the previous ones:

```java
MD5 instance = ...;
instance.md5("Hello", ar -> {
  System.out.println(ar.result());
});
```

Instead of getting the result directly, it receives an `AsyncResult` and gets the computed result using the `result()` method.


## Step 5 – Managing failures

In the previous example, the `md5` method was returning only simple result (a `String`). But how can we manage exceptions and failures? As the md5 computation is executed in another thread, throwing an exception is useless as the caller cannot catch it.  `AsyncResult` can be created to indicate that something wrong happened:

```java
public void md5(String message, Handler<AsyncResult<String>> resultHandler) {
  vertx.executeBlocking(
      future -> {
        if (message == null) {
          future.fail(
            new NullPointerException("message must not be `null`"));
        } else {
          String result = DigestUtils.md5Hex(message);
          future.complete(result);
        }
      },
      resultHandler::handle
  );
}
```

For instance, in the previous code, if `message` is `null`, we create a `NullPointerException` (an `IllegalArgumentException` would be fine too), and this exception is passed to `future.fail()`. This means that the operation has failed. The exception is the cause of the failure.

The caller can now check whether or not the operation has succeeded:

```java
MD5 instance = ...;
instance.md5("Hello", ar -> {
  if (ar.failed()) {
    System.err.println(ar.cause().getMessage());
  } else {
    System.out.println(ar.result());
  }
});
```

As you can see the traditional `try / catch` is now managed in the code receiving the result using an `if / then` structure.

## Step 5 – Chaining asynchronous operations

So far we have seen how our `md5` became asynchronous. But, what happens when two asynchronous operations need to be chained. For example, our md5 computation is actually doing two different things:

1. compute the md5
2. encode it as a String containing hex characters

Traditional (blocking) code would do something like:

```java
byte[] sum = md5(message);
String result = hex(sum);
```
Let’s transform these methods to be asynchronous.

First, we need two interfaces. The `MD5` interface computes a byte array, so is adapted as follows:

```java
public interface MD5 {
  void md5(String message,
    Handler<AsyncResult<byte[]>> resultHandler);
}
```

The `hex` method takes a byte array as parameter and computes a `String`:

```java
public interface Hex {
  void hex(byte[] bytes, Handler<AsyncResult<String>> resultHandler);
}
```

As you can see, both interfaces take `Handler<AsyncResult>` as parameters. The implementations invoke these handlers when their processing has been completed. Let’s start with the `md5` method:

```java
@Override
public void md5(String message,
  Handler<AsyncResult<byte[]>> resultHandler) {

    vertx.executeBlocking(
        future -> {
          if (message == null) {
            future.fail(
              new NullPointerException(
                "message must not be `null`"
            ));
          } else {
            final byte[] bytes = DigestUtils.md5(message);
            future.complete(bytes);
          }
        },
        resultHandler::handle);
}
```

The `md5` method is not much different from before, except that it now has a byte array as result. The `hex` method receives the computed byte array and encodes it:

```java
@Override
public void hex(byte[] bytes,
  Handler<AsyncResult<String>> resultHandler) {

  vertx.executeBlocking(
      future -> {
        String hex = Hex.encodeHexString(bytes);
        future.complete(hex);
      },
      resultHandler::handle
  );

}
```

Ok, but how do we chain the two operations? The result handler passed to the `md5` method is now going to call the `hex` method, that receives a result handler printing the result:

```java
MD5 md5Instance = ...;
Hex hexInstance = ...;
md5Instance.md5("Hello",
    md5Result -> {
      if (md5Result.succeeded()) {
        hexInstance.hex(md5Result.result(),hexResult -> {
          System.out.println(hexResult.result());
        });
      } else {
	      System.err.println(
          "Failed to compute the md5 checksum:"
          + md5Result.cause().getMessage());
      }
    }
);
```

## Conclusion

That's all! This post has presented the basic notions behind asynchronous/non-blocking API and how you can use them and implement them.

Happy coding !
