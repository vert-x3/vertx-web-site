---
title: An Introduction to the Vert.x Context Object
template: post.html
date: 2017-01-31
author: millross
---

Under the hood, the vert.x Context class plays a critical part in maintaining the thread-safety guarantees of verticles. Most of the time, vert.x coders don't need to make use of Context objects directly. However, sometimes you may need to. This article provides a brief introduction to the vert.x Context class, which covers why it's important, and why and when you might wish to make use of the Context directly, based on the author's experience of building a generic async library which can be used with vert.x.

[NOTE this is a re-publication of the following [blog post](http://www.millross-consultants.com/vertx_context_object.html)]

## The Context object in Vert.x - a brief introduction

### Introduction

Recently I've been looking at the possibility of building an asynchronous version of the [pac4j](http://www.pac4j.org) library, with a view to then migrating the [vertx-pac4j](https://github.com/pac4j/vertx-pac4j) implementation to use the asynchronous version of pac4j by default.

I'm keen (for obvious reasons) that the async version of pac4j is not tightly coupled to  one particular asynchronous/non-blocking framework, I decided to expose the API via the [CompletableFuture](http://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html) class, using this to wrap values which will be determined in the future. However, I opted to use the [vert.x](http://vertx.io) framework for my asynchronous testing as a way of testing the API as it emerged. This in turn has led me to learn some aspects of the vert.x [Context](http://vertx.io/docs/apidocs/io/vertx/core/Context.html) class which I didn't really understand before.

[NOTE The information presented relates to Vert.x version 3.3.3. It is conceivable that later versions of vert.x could render aspects of this article incorrect.]

### Introduction to the Context class

Whenever a vert.x [Handler](http://vertx.io/docs/apidocs/io/vertx/core/Handler.html) is executed, or the start or step method of a verticle is called, then that execution is associated with a specific context. Generally a context is an event-loop context and is therefore associated with an event loop thread (exceptions are covered in the Further Reading referenced below). Contexts are propagated. When a handler is set by code running on a specific context, then that handler will also be executed on the same context. This means for example, that if the start method of a verticle instance sets a number of event bus handlers (as many do), then they will all run on the same context as the start method for that verticle (so all handlers for that verticle instance will share a common context). 

A schematic of the relationships between non-worker verticles, contexts and eventloop threads is shown in Figure 1. 

![Vertx Context/Thread/Verticle Relationships](/assets/blog/vertx3-intro-to-context-object/VertxContextRelationships.png)

Note that each verticle effectively has only one context for handlers created by its start method, and each context is bound to a single event-loop thread. A given event-loop thread can, however, have multiple contexts bound to it. 

### When are contexts not propagated? 

When a verticle's start method is called, a new context is created. If 4 identical verticles are deployed via the instances parameter on DeploymentOptions, the start method of each will be on a new context. This is logical as we may not want all non-worker verticles to be bound to a single eventloop thread when multiple eventloop threads are available. 

### Threading Guarantees

There are certain consequences of the propagation of contexts to handlers as mentioned above. The most important one is that since all handlers in a given eventloop verticle run on the same context (the one on which its start method ran), they all run on the same eventloop thread. This gives rise to the threading guarantee within vert.x, that as long as a given verticle is the only one to ever access a piece of state, then that state is being accessed by only one thread, so no synchronization will be necessary. 

### Exception Handling
Each context can have its own exception handler attached for handling exceptions which occur during event loop processing.
    
#### Why might you not want the default exception handler?
    
As one example, you might have some verticles running whose job it is to monitor other verticles, and if something appears to go wrong with them, undeploy and restart them, a frequent pattern in an actor- or microservices- style archictecture. So one option could be that when a supervised verticle encounters an unrecoverable error, it could simply notify its supervisor that it has gone wrong via an eventbus message, and its supervisor could then undeploy and redeploy (and after a number of failures in rapid succession possibly give up hope or escalate to its own supervisor.
    
### Going off-context and getting back onto a particular context

There are several reasons why you might execute code off-context and then want to operate back on a vert.x context when complete. I'll outline a couple of scenarios below
    
#### Running code on a separate thread

Firstly you might be using an asynchronous driver which is entirely vertx-unaware. Its code will run on non-eventloop threads but it's possible you may then want to use the results of that code to update information within your verticle. If you don't get back onto the correct context, you can't make any guarantees about thread-safety, so your subsequent processing needs to be run back on the correct eventloop thread.
    
#### Using asynchronous Java 8 APIs

APIs such as CompletableFuture are context-unaware. In one example, I created an already completed future on the vert.x event loop in a test. I then attached subsequent processing to it via thenRun:-
    
```java
@RunWith(VertxUnitRunner.class)
public class ImmediateCompletionTest {
    @Rule
    public final RunTestOnContext rule = new RunTestOnContext();

    @Test
    public void testImmediateCompletion(TestContext context) {

        final Async async = context.async();
        final Vertx vertx = rule.vertx();
        final CompletableFuture<Integer> toComplete = new CompletableFuture<>();
        // delay future completion by 500 ms
        final String threadName = Thread.currentThread().getName();
        toComplete.complete(100);
        toComplete.thenRun(() -> {
            assertThat(Thread.currentThread().getName(), is(threadName));
            async.complete();
        });
    }
}
```
    
  Naively one might expect this to automatically run on the context, since it hasn't left the eventloop thread on which the future was completed, and indeed it's provable that it is on the correct thread. However, it will not be on the correct context. This would mean that it wouldn't, for example, invoke any modified exception handler attached to the context.
    
#### Getting back on context

Fortunately, once we've left the context, it's quite straightforward to return to it. Prior to definition of the code block within thenRun, we can use Vertx.currentContext() or vertx.getOrCreateContext() to get a handle to the context on which our eventloop code is running, We can then execute the code block inside a call to Context::runOnContext, similar to

```java
final Context currentContext = vertx.getOrCreateContext();
toComplete.thenRun(() -> {
        currentContext.runOnContext(v -> {
        assertThat(Thread.currentThread().getName(), is(threadName));
        async.complete();
    }
});
```
While getting back onto the correct context may not be critical if you have remained on the event loop thread throughout, it is critical if you are going to invoke subsequent vert.x handlers, update verticle state or anything similar, so it's a sensible general approach.
    
### Further Reading

The vert.x team themselves offer an excellent blog about the Vert.x eventloop, with excellent material on the context, on [Github](https://github.com/vietj/vertx-materials/blob/master/src/main/asciidoc/Demystifying_the_event_loop.adoc).
    
### Thanks
Thanks very much to the vert.x core team for their clear github pages on the eventloop, and also to [Alexander Lehmann](https://twitter.com/alexlehm?lang=en) for his answers to my stupid and naive questions on the [Vert.x google group](https://groups.google.com/forum/#!forum/vertx).
