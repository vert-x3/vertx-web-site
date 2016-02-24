---
title: Automatic redeployment in Eclipse IDE
date: 2015-12-20
template: post.html
author: cescoffier
---

Vert.x 3.1 has (re-) introduced the _redeploy_ feature. This blog post explains how to use this feature in the Eclipse IDE. However, you can easily adapt the content to your IDE.

## How does redeploy work

How is implemented the `redeploy` is not as you may expect. First, the redeploy does not rely on a build tool, but is integrated in vert.x. However you can plug your build tools with the redeploy feature. This feature is offered by the `io.vertx.core.Launcher` class. The redeployment process is actually very simple:

1. the application is launched in _redeploy mode_.
2. it listens for file changes
3. when a _matching_ file is changed, it stops the application
4. it executes the `on-redeploy` actions if any
5. it restarts the application
6. back to (2)

Initially the application is launched in _redeploy mode_. The application is actually launched in background, in a separated process. Vert.x listens for file changes. You give it a set of (Ant-style) patterns and every time a matching file changes, Vert.x stops the whole application and restarts it. Optionally you can configure a `on-redeploy` action to plug in your build tools.

To integrate this process in Eclipse (or in your IDE), you just need to configure the set of listened files, and let the `Launcher` class starts and stops your application.

## Redeploy in Eclipse

The following screencast explains how you configure a vert.x application to be run in Eclipse and how to configure the redeploy:

<iframe width="420" height="315" src="https://www.youtube.com/embed/iyZwAzEVX-o" frameborder="0" allowfullscreen></iframe>

To summarize the last configuration:

* it's a Java application configuration
* it uses `io.vertx.core.Launcher` as main class
* In the _Program arguments_ (_Arguments_ tab), write: `run org.acme.verticle.MyMainVerticle --redeploy="src/**/*.java" --launcher-class=io.vertx.core.Launcher`

## Redeploy with your own Main class

Let's now imagine that you have your own `Main` class, starting your application. For instance, it can be something like:

```
package org.acme.vertx;

import io.vertx.core.Vertx;

public class Main {

	public static void main(String[] args) {
		Vertx vertx = Vertx.vertx();
		vertx.deployVerticle(MyMainVerticle.class.getName());
	}

}
```

The redeploy feature from vert.x lets you use your own `Main` class:

1. Create another `Run` configuration
2. Set the `Main-Class` to `io.vertx.core.Launcher` (yes, the one from vert.x not yours)
3. In the application parameter add: `run --redeploy="src/**/*.java" --launcher-class=org.acme.vertx.Main`

With this configuration, the application is launched in background using your own `Main` class, and will restart the application every time you change your source code (you can even change the source code of your `Main` class).
