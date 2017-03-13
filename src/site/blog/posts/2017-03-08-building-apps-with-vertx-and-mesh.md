---
title: Data-driven Apps made easy with Vert.x 3.4.0 and headless CMS Gentics Mesh 
template: post.html
date: 2017-03-13
author: jotschi
---

In this article, I would like to share why Vert.x is not only a robust foundation for the [headless Content Management System Gentics Mesh](http://getmesh.io/) but also how the recent release 3.4.0 can be used to build a template-based web server with Gentics Mesh and handlebars.

A headless CMS focuses on delivering your content through an API and allows editors creating and managing that data through a web-based interface. Unlike a traditional CMS, it does not provide a specifically rendered output. The frontend part (the head) is literally cut off, allowing developers create websites, apps, or any other data-driven projects with their favourite technologies.

[Vert.x 3.4.0](http://vertx.io/blog/vert-x-3-4-0-is-released/) has just been released and it comes with a bunch of new features and bug fixes. I am especially excited about a small enhancement that changes the way in which the handlebars template engine handle their context data. Previously it was not possible to resolve Vert.x 's JsonObjects within the render context. With my enhancement [#509](https://github.com/vert-x3/vertx-web/pull/509) - released in Vert.x 3.4.0 - it is now possible to access nested data from these objects within your templates. Previously this would have required flattening out each object and resolving it individually, which would have been very cumbersome.

I'm going to demonstrate this enhancement by showing how to build a product catalogue using Vert.x together with handlebars templates to render and serve the web pages. The product data is managed, stored and delivered by the CMS server as source for JSON data.

## Clone, Import, Download, Start - Set up your product catalogue website quickly

Let's quickly set up everything you need to run the website before I walk you through the code.

### 1.  Clone - [Get the full Vert.x with Gentics Mesh example from Github](https://github.com/gentics/mesh-vertx-example)

Fire up your terminal and clone the example application to the directory of your choice.

```bash
git clone git@github.com:gentics/mesh-vertx-example.git
```

### 2. Import - The maven project in your favourite IDE

The application is set up as a maven project and can be imported in Eclipse IDE via File → Import → Existing Maven Project

### 3. Download  -  Get the headless CMS Gentics Mesh

[Download the latest version of Gentics Mesh](http://getmesh.io/Download) and start the CMS with this one-liner

```bash
java -jar mesh-demo-0.6.xx.jar
```

For the current example we are going to use the read-only user credentials (_webclient:webclient_).
If you want to play around with the demo data you can point your browser to <http://localhost:8080/mesh-ui/> to reach the Gentics Mesh user interface and use one of the [available demo credentials](http://getmesh.io/docs/beta/getting-started.html#_startup) to login.

<img class="img-responsive center-block" src="{{ site_url }}assets/blog/vertx-mesh/mesh-ui.jpg" title="Gentics Mesh User Interface">

### 4. Start - The application and browse the product catalogue

You can start the Vert.x web server by running Server.java.

That's it - now you can access the product catalogue website in your browser: <http://localhost:3000>

## Why Vert.x is a good fit for Gentics Mesh

Before digging into the example, let me share a few thoughts on Vert.x and Gentics Mesh in combination. In this example Vert.x is part of the frontend stack in delivering the product catalogue website. But it might also be of interest to you that Vert.x is also used at the very heart of Gentics Mesh itself. The Gentics Mesh [REST API endpoints](http://getmesh.io/docs/beta/raml/) are built on top of Vert.x as a core component.

The great thing about Vert.x is that there are a lot of default implementations for various tasks such as authentication, database integration, monitoring and clustering. It is possible to use one or more features and omit the rest and thus your application remains lightweight.

## Curious about the code?

Source: <https://github.com/gentics/mesh-vertx-example>

Now that everything is up and running let's have a detailed look at the code.

A typical deployment unit for Vert.x is a [verticle](http://vertx.io/docs/vertx-core/java/#_verticles). In our case we use the verticle to bundle our code and run the web server within it. Once deployed, Vert.x will run the verticle and start the HTTP server code.

<script src="https://gist.github.com/Jotschi/39fc0d3fcd45122eafe68d61bea4c120.js?file=main.java"></script>

The [Gentics Mesh REST client](http://getmesh.io/docs/beta/#_java_rest_client) is used to communicate with the Gentics Mesh server. The [Vert.x web library](http://vertx.io/docs/vertx-web/java/) is used to set up our [HTTP Router](http://vertx.io/docs/vertx-web/java/#_basic_vert_x_web_concepts). As with other routing frameworks like _Silex_ and _Express_, the router can be used to create routes for inbound HTTP requests. In our case we only need two routes. The main route which accepts the request will utilize the [Gentics Mesh Webroot API Endpoint](http://getmesh.io/docs/beta/#_webroot) which is able to resolve content by a provided path. It will examine the response and add fields to the routing context.

The other route is chained and will take the previously prepared routing context and render the desired template using the [handlebars template handler](http://vertx.io/docs/vertx-web/java/#_templates).

<script src="https://gist.github.com/Jotschi/39fc0d3fcd45122eafe68d61bea4c120.js?file=start.java"></script>

First we can handle various special requests path such as "/" for the welcome page. Or the typical favicon.ico request. Other requests are passed to the Webroot API handler method.

<script src="https://gist.github.com/Jotschi/39fc0d3fcd45122eafe68d61bea4c120.js?file=pathHandler.java"></script>

Once the path has been resolved to a _WebRootResponse_ we can examine that data and determine whether it is a binary response or a JSON response. Binary responses may occur if the requested resource represents an image or any other binary data. Resolved binary contents are directly passed through to the client and the handlebars route is not invoked.

Examples

* [http://localhost:3000/](http://localhost:3000/) → welcome.hbs
* [http://localhost:3000/Automobiles](http://localhost:3000/Automobiles) → category → productList.hbs
* [http://localhost:3000/Automobiles/Tesla Roadster](http://localhost:3000/Automobiles/Tesla%20Roadster) → vehicle → productDetail.hbs
* [http://localhost:3000/Vehicle Images/tesla-roadster.jpg](http://localhost:3000/Vehicle%20Images/tesla-roadster.jpg) → binary passthru

JSON responses on the other hand are examined to determine the type of node which was located. A typical node response contains information about the schema used by the node. This will effectively determine the type of the located content (e.g.: category, vehicle).

<script src="https://gist.github.com/Jotschi/39fc0d3fcd45122eafe68d61bea4c120.js?file=routeHandler.java"></script>

<img class="img-responsive center-block" src="{{ site_url }}assets/blog/vertx-mesh/mesh-schemas.jpg" title="Mesh Schemas">

The demo application serves different pages which correspond to the identified type.
Take a look at the template sources within _src/main/resources/templates/_ if you are interested in the [handlebars syntax](http://handlebarsjs.com/). 
The templates in the example should cover most common cases.   

<img class="img-responsive center-block" src="{{ site_url }}assets/blog/vertx-mesh/mesh-vertx-templates.jpg" title="Handlebars Template Overview">

The Mesh REST Client library internally makes use of the [Vert.x core HTTP client](http://vertx.io/docs/vertx-core/java/#_creating_an_http_client).

[RxJava](https://github.com/ReactiveX/RxJava) is being used to handle these async requests. This way we can combine all asynchronously requested Gentics Mesh resources (breadcrumb, list of products) and add the loaded data into the routing context.

The Vert.x example server loads JSON content from the Gentics Mesh server. The _JsonObject_ is placed in the [handlebars](https://github.com/jknack/handlebars.java) render context and the template can access all nested fields within.

This way it is possible to resolve any field within the handlebars template.

<script src="https://gist.github.com/Jotschi/39fc0d3fcd45122eafe68d61bea4c120.js?file=template.example"></script>

That's it! Finally, we can invoke mvn clean package in order to package our webserver. The [maven-shade-plugin](https://maven.apache.org/plugins/maven-shade-plugin/) will bundle everything and create an executable jar.

## What's next?

Future releases of Gentics Mesh will refine the Mesh REST Client API and provide a [GraphQL](http://graphql.org/) which will reduce the JSON overhead. Using GraphQL will also reduce the amount of requests which need to be issued.

Thanks for reading. If you have any futher questions or feedback don’t hesitate to send me a tweet to [@Jotschi](https://twitter.com/Jotschi/) or [@genticsmesh](https://twitter.com/genticsmesh/).
