---
title: Building a real-time web app with Angular/Ngrx and Vert.x
template: post.html
date: 2017-04-26
author: benorama
---

Nowadays, there are multiple tech stacks to build a real-time web app. What are the best choices to build real-time Angular client apps, connected to a JVM-based backend? This article describes an Angular+Vertx real-time architecture with a Proof of Concept demo app.

[NOTE this is a re-publication of the following [Medium post](https://medium.com/@benorama/building-a-realtime-web-app-with-angular-ngrx-and-vert-x-a5381c0397a1)]

## Intro

**Welcome to the real-time web!** It's time to move on from traditional synchronous HTTP request/response architectures to reactive apps with connected clients (ouch... that's a lot of buzzwords in just one sentence)!

![Real-time app](/assets/blog/vertx-realtime-angular-ngrx/data-in-motion.jpg)

_Image source: https://www.voxxed.com_

To build this kind of app, [MeteorJS](https://www.meteor.com) is the new cool kid on the block (v1.0 released in october 2014): **a full stack Javascript platform to build connected-client reactive applications**. It allows JS developers to build and deploy amazing modern web and mobile apps (iOS/Android) in no time, using a unified backend+frontend code within a single app repo. That's a pretty ambitious approach but it requires a very opinionated and highly coupled JS tech stack and it's still a pretty niche framework.

Moreover, we are a Java shop on the backend. At AgoraPulse, we rely heavily on :
* [Angular](https://angular.io) and [Ionic](http://ionicframework.com) for the JS frontend (with a shared business/data architecture based on [Ngrx](https://github.com/ngrx/store)),
* [Groovy](http://www.groovy-lang.org) and [Grails](https://grails.org) ecosystem for the JVM backend.

So my question is:

> What are the best choices to build real-time Angular client apps, connected to a JVM-based backend these days?

Our requirements are pretty basic. We don't need full Meteor's end-to-end application model.
We just want to be able to :
1. build a reactive app with an event bus on the JVM, and
2. extend the event bus down to the browser to be able to publish/subscribe to real-time events from an Angular app.

### Server side (JVM)

Reactive apps is a hot topic nowadays and there are many great libs/platforms to build this type of event-driven architecture on the JVM:
* [Vert.x](http://vertx.io),
* [Lightbend](https://www.lightbend.com) platform (Play, Akka, Scala),
* Spring [Project Reactor](http://projectreactor.io) (integrated into Grails 3.0).

### Client side

[ReactJS](http://facebook.github.io/react/) and [Angular](https://angular.io) are the two most popular framework right now to build modern JS apps. Most platforms use [SockJS](https://github.com/sockjs/sockjs-client) to handle real-time connections:
* [Vertx-web](http://vertx.io/docs/vertx-web/groovy/) provides a SockJS server implementation with an event bus bridge and a [vertx-evenbus.js](http://vertx.io/docs/vertx-web/groovy/#_sockjs_event_bus_bridge) client library (very easy to use),
* Spring provides websocket SockJS support though Spring Messaging and Websocket libs (see an example [here](https://spring.io/guides/gs/messaging-stomp-websocket/))

### Final choice: Vert.x + Angular

In the end, I've chosen to experiment with Vert.x for its excellent Groovy support, distributed event bus, scalability and ease of use.

I enjoyed it very much. Let me show you the result of my experimentation which is the root of our real-time features coming very soon in AgoraPulse v6.0!

## Why Vert.x?

Like other reactive platform, Vert.x is event driven and non blocking. It scales very well (even more that Node.js).

Unlike other reactive platforms, Vert.x is polyglot: you can use Vert.x with multiple languages including Java, JavaScript, Groovy, Ruby, Ceylon, Scala and Kotlin.

Unlike Node.js, Vert.x is a general purpose tool-kit and unopinionated. It's a versatile platform suitable for many things: from simple network utilities, sophisticated modern web applications, HTTP/REST microservices or a full blown back-end message-bus application.

Like other reactive platforms, it looks scary in the begining when you read the documentation… ;) But once you start playing with it, it remains fun and simple to use, especially with Groovy! Vert.x really allows you to build substantial systems without getting tangled in complexity.

In my case, I was mainly interested by the distributed event-bus provided (a core feature of Vert.x).

**To validate our approach, we built prototypes with the following goals:**
* **share and synchronize a common (Ngrx-based) state between multiple connected clients, and**
* **distribute real-time (Ngrx-based) actions across multiple connected clients, which impact local states/reducers.**

_Note: [@ngrx/store](https://github.com/ngrx/store) is a RxJS powered state management inspired by Redux for Angular apps. It's currently the most popular way to structure complex business logic in Angular apps._

![Redux](/assets/blog/vertx-realtime-angular-ngrx/redux.png)

_Source: https://www.smashingmagazine.com/2016/06/an-introduction-to-redux/_

## PROOF OF CONCEPT

Here is the repo of our initial proof of concept:

http://github.com/benorama/ngrx-realtime-app

The repo is divided into two separate projects:
* **Vert.x server app**, based on [Vert.x](http://vertx.io) (version 3.3), managed by [Gradle](https://gradle.org), with a main verticle developed in [Groovy](http://groovy-lang.org) lang.
* **Angular client app**, based on Angular (version 4.0.1), managed by [Angular](https://angular.io) CLI with state, reducers and actions logic based on [@ngrx/store](https://github.com/ngrx/store) (version 2.2.1)

For the demo, we are using the counter example code (actions and reducers) from [@ngrx/store](https://github.com/ngrx/store).

The counter client business logic is based on:
* `CounterState` interface, counter state model,
* `counterReducer` reducer, counter state management based on dispatched actions, and
* _Increment_, _decrement_ and _reset_ counter actions.

State is maintained server-side with a simple singleton `CounterService`.

```groovy
class CounterService {
    static INCREMENT = '[Counter] Increment'
    static DECREMENT = '[Counter] Decrement'
    static RESET = '[Counter] Reset'
    int total = 0
    void handleEvent(event) {
        switch(event.type) {
            case INCREMENT:
                total++
                break
            case DECREMENT:
                total--
                break
            case RESET:
                total = 0
                break
        }
    }
}
```

### Client state initialization through Request/Response

Initial state is initialized with simple **request/response** (or send/reply) on the event bus.
Once the client is connected, it sends a request to the event bus at the address **counter::total**. The server replies directly with the value of `CounterService` total and the client dispatches locally a _reset_ action with the total value from the reply.

![Vertx Request Response](/assets/blog/vertx-realtime-angular-ngrx/vertx-request-response.png)

_Source: https://www.slideshare.net/RedHatDevelopers/vertx-microservices-were-never-so-easy-clement-escoffier_

Here is an extract of the corresponding code (from `AppEventBusService`):

```typescript
initializeCounter() {
    this.eventBusService.send('counter::total', body, (error, message) => {
    // Handle reply
    if (message && message.body) {
            let localAction = new CounterActions.ResetAction();
            localAction.payload = message.body; // Total value
            this.store.dispatch(localAction);
        }
    });
}
```

### Actions distribution through Publish/Subscribe

Action distribution/sync uses the **publish/subscribe** pattern.

Counter actions are published from the client to the event bus at the address **counter::actions**.

Any client that have subscribed to **counter::actions** address will receive the actions and redispatch them locally to impact app states/reducers.

![Vertx Publish Subscribe](/assets/blog/vertx-realtime-angular-ngrx/vertx-publish-subscribe.png)

_Source: https://www.slideshare.net/RedHatDevelopers/vertx-microservices-were-never-so-easy-clement-escoffier_

Here is an extract of the corresponding code (from `AppEventBusService`):

```typescript
publishAction(action: RemoteAction) {
    if (action.publishedByUser) {
        console.error("This action has already been published");
        return;
    }
    action.publishedByUser = this.currentUser;
    this.eventBusService.publish(action.eventBusAddress, action);
}
subscribeToActions(eventBusAddress: string) {
    this.eventBusService.registerHandler(eventBusAddress, (error, message) => {
        // Handle message from subscription
        if (message.body.publishedByUser === this.currentUser) {
            // Ignore action sent by current manager
            return;
        }
        let localAction = message.body;
        this.store.dispatch(localAction);
    });
}
```

The event bus publishing logic is achieved through a simple Ngrx Effects. Any actions that extend `RemoteAction` class will be published to the event bus.

```typescript
@Injectable()
export class AppEventBusEffects {

    constructor(private actions$: Actions, private appEventBusService: AppEventBusService) {}
    // Listen to all actions and publish remote actions to account event bus
    @Effect({dispatch: false}) remoteAction$ = this.actions$
        .filter(action => action instanceof RemoteAction && action.publishedByUser == undefined)
        .do((action: RemoteAction) => {
            this.appEventBusService.publishAction(action);
        });

    @Effect({dispatch: false}) login$ = this.actions$
        .ofType(UserActionTypes.LOGIN)
        .do(() => {
            this.appEventBusService.connect();
        });
}
```

You can see all of this in action by locally launching the server and the client app in two separate browser windows.

![Demo app screen](/assets/blog/vertx-realtime-angular-ngrx/demo-app-screen.png)

_Bonus: the demo app also includes user status (offline/online), based of the event bus connection status._

The counter state is shared and synchronized between connected clients and each local action is distributed in real-time to other clients.

**Mission accomplished!**

[NOTE Typescript version of Vertx EventBus Client | The app uses our own Typescript version of the official JS [Vertx EventBus Client](https://github.com/vert-x3/vertx-bus-bower). It can be found [here](https://gist.github.com/benorama/93373c3c1c3574732d6cc1b4754aab9f), any feedback, improvement suggestions are welcome!]
