---
title: A To Do Application using Vert.X
template: post.html
date: 2016-03-30
author: Ashwin-Surana
---
What’s the best way to learn about a framework? By building an application on it, of course! This post will get you kickstarted in Vert.X as we develop a simple Todo Web application.
##What "To Do" ?
A ToDo app, simply maintains a list of todo entries.(Duh!) In geek speak, it is a CRUD application in which a user can create a todo entry and then view, modify and delete entries. As with any web application, we need to develop a frontend like a webpage; and a backend to write the Web services. Good news! Half our work is already done- thanks to the [todobackend](http://todobackend.com) site. 

The site has a readymade [client](http://todobackend.com/client/index.html), which we will be using as our front end. This website defines a simple web API in the form of a ToDo list and users can create their own identical APIs using various tech stacks, which is what we will be doing in this post. The site also provides a [spec runner](http://todobackend.com/specs/index.html) to verify that the user implementation is identical to the base implementation.

In this application, you will learn to:
* Setup [CORS](http://enable-cors.org/) in Vert.X
* Create RESTful services in Vert.X

Let’s jump right into the development, shall we?
##File->New->Project
First step would be to create a Maven project. (You can use Gradle too, but for this blog we shall continue with Maven.)

Once that’s done, check if your project structure looks like this

```    
     ├── src
     │   └── main
     │       └── java
     └── pom.xml
```
Yes? OK now let’s update the pom.xml with dependencies and other properties. 

```
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns="http://maven.apache.org/POM/4.0.0"
        xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
   <modelVersion>4.0.0</modelVersion>
   <groupId>io.vertx.example</groupId>
   <artifactId>to-do-list</artifactId>
   <version>1.0-SNAPSHOT</version>
   <packaging>jar</packaging>

   <dependencies>
       <dependency>
           <groupId>io.vertx</groupId>
           <artifactId>vertx-web</artifactId>
           <version>3.2.1</version>
       </dependency>
   </dependencies>

   <build>
       <plugins>
           <plugin>
               <artifactId>maven-compiler-plugin</artifactId>
               <version>3.5.1</version>
               <configuration>
                   <source>1.8</source>
                   <target>1.8</target>
                   <encoding>UTF-8</encoding>
               </configuration>
           </plugin>
      </plugins>
   </build>
</project>
```
Vert.X requires Java 8, so its important that we configure maven compiler to use it. Once that’s out of the way, we can get started on the coding. 

##On your mark, get set, code!
For every todo entry we need to maintain four pieces of information:
* Title      -  the ToDo task message
* Completed  -  whether the task has been completed or not
* URL        -  unique URL for every ToDo task
* Order      -  has an integer value

Keeping this in mind, we create a [ToDoItem](https://github.com/Ashwin-Surana/to-do-backend/blob/master/src/main/java/io/vertx/example/todo/domain/ToDoItem.java) POJO class. We will use this class to store information on every todo entry the user makes.

[WARNING It is important that we don't change the name of the fields as we will be encoding and decoding objects of this class using [Json](http://vertx.io/docs/apidocs/io/vertx/core/json/Json.html) class provided by Vert.X Core API.]

 Next up, we have to maintain the todo list of items in our application. The user should be able to fetch all todo items, create a new todo item, delete as well as update an existing item. So, the next step is to write a service to support all these operations and maintain a list of todos. For the simplicity of this post, we will maintain the list of todos in an ArrayList. This [ToDoService](https://github.com/Ashwin-Surana/to-do-backend/blob/master/src/main/java/io/vertx/example/todo/service/ToDoService.java) class will maintain the entries of every ToDoItem and supports all operations discussed above.

##It's time for Vert.X
Now that we are done writing the service, it’s time to get to the heart of the application - Vert.x! We start off by creating a verticle. Verticles are chunks of code deployed and run by Vert.x. The advantage of Vert.X is that you don’t have to stick to one language. It is a polyglot framework - we can implement one verticle, in say Java and another in Groovy. (But for our application, we restrict ourselves to Java 8).

So here we have a [ToDoVerticle](https://github.com/Ashwin-Surana/to-do-backend/blob/master/src/main/java/io/vertx/example/todo/verticles/ToDoVerticle.java) which implements the REST endpoints mentioned above. Don't get overwhelmed by the lines of code in the ToDoVerticle. To make it easier for you to understand, let's analyse the  code in bits and pieces. 

```
public void start() throws Exception {
        init();
        setRoutes();
        startServer();
}
```
When the verticle is deployed, its start method is invoked. In this method, we have made sequential calls to init(), setRoutes() and startServer(). Let's look at what the init() method does.
``` 
 private void init() {
        router = Router.router(vertx);
        toDoService = new ToDoService();
        setupCORS();
 }
```
In the init() method, we create a [Router](http://vertx.io/docs/apidocs/io/vertx/ext/web/Router.html) object. This router object is responsible for routing all incoming HTTP requests to the first matching [Route](http://vertx.io/docs/apidocs/io/vertx/ext/web/Route.html). A route then invokes the request handler, if the request's path, method, etc. match the criteria. So once the router object is created, we instantiate the ToDoService, followed by a method call to setupCORS(). 

##TODO: Setup CORS
For the routes `/todo` and `/todo/:id`, we define the [CorsHandler](http://vertx.io/docs/apidocs/io/vertx/ext/web/handler/CorsHandler.html).
```
 private void setupCORS() {
        Set<HttpMethod> toDoUrlMethodSet = new HashSet<>(Arrays.asList(HttpMethod.GET,
                HttpMethod.DELETE, HttpMethod.POST, HttpMethod.PATCH, HttpMethod.OPTIONS));

        Set<HttpMethod> toDoIdUrlMethodSet = new HashSet<>(Arrays.asList(HttpMethod.GET,
                HttpMethod.DELETE, HttpMethod.PATCH, HttpMethod.OPTIONS));
                   //TODO_URL = "/todo"
        router.route(TODO_URL).handler(CorsHandler.create("*")
                .allowedMethods(toDoUrlMethodSet)
                .allowedHeader("Content-Type"));
                   //TODO_ID_URL = "/todo/:id"
        router.route(TODO_ID_URL).handler(CorsHandler.create("*")
                .allowedMethods(toDoIdUrlMethodSet)
                .allowedHeader("Content-Type"));
 }
```
We create a set of allowed HttpMethod and headers for each route and reference it to their respective CorsHandler. For further understanding of CORS, you can refer to this [site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS). 

##REST with Vert.X
Vert.x Web features fluent API's for creating RESTful services. Using these API's, we need to implement the following REST endpoints

* `GET /todo` : _Will return the todo list_
* `POST /todo` : _Creates a todo item entry in the list_
* `DELETE /todo` : _Clears todo list_
* `GET /todo/:id` : _Gets the todo which has url ending with /todo/{id value}_
* `DELETE /todo/:id` : _Deletes the todo which has url ending with /todo/{id value}_
* `PATCH /todo/:id` : _Updates the values of the existing todo entry_ 

[NOTE The ":id" in route "/todo/:id" is called the [path parameter](http://vertx.io/docs/vertx-web/js/#_capturing_path_parameters).]

In the `setRoutes()` method, mapping for a HTTP request on a route and its corresponding handler is provided to the router.
```
private void setRoutes() {
                // TODO_URL = "/todo"
        router.get(TODO_URL).handler(this::getToDos);
        router.delete(TODO_URL).handler(this::clearToDo);
        router.post(TODO_URL).handler(this::createToDo);
                 //TODO_ID_URL = "/todo/:id" 
        router.get(TODO_ID_URL).handler(this::getToDoWithId);
        router.delete(TODO_ID_URL).handler(this::deleteToDoWithId);
        router.patch(TODO_ID_URL).handler(this::updateToDoWithId);
}
```
To drill down further, consider this line
```
router.get(TODO_URL).handler(this::getToDos);
```
Here, we inform the router to invoke getToDos() method if a HttpRequest of HttpMethod **GET** arrives on the route TODO_URL = "/todo". Here, `this::getToDos` is a lambda expression that has been introduced in Java 8. An alternative for this is to implement the interface [Handler<RoutingContext>](http://vertx.io/docs/apidocs/io/vertx/core/Handler.html). Similarly you can interpret the other routes that has been defined.

Let's take a look in to `getToDos()` method to gain understanding on how to process the request. 
```
private void getToDos(RoutingContext context) {
        context.response().setStatusCode(HttpResponseStatus.OK.code())
                .putHeader("content-type", "application/json; charset=utf-8")
                .end(Json.encode(toDoService.getAll()));
}
```
Every handler gets a [RoutingContext](http://vertx.io/docs/apidocs/io/vertx/ext/web/RoutingContext.html) object, for the accepted request. The context has access to [HttpServerRequest](http://vertx.io/docs/apidocs/io/vertx/core/http/HttpServerRequest.html) and [HttpServerResponse](http://vertx.io/docs/apidocs/io/vertx/core/http/HttpServerResponse.html). So when we get a GET request from the user, we encode the list of todo items as a json message and send it as a response with content type as `application/json` and the HTTP response status code as `200` (i.e. OK). 

That was quite simple right? Now let's try understanding another handler, `createToDo()`
```
 private void createToDo(RoutingContext context) {
        context.request().bodyHandler(buffer -> {
            ToDoItem item = Json.decodeValue(buffer.getString(0, buffer.length()), ToDoItem.class);
            item.setUrl(context.request().absoluteURI());
            context.response().setStatusCode(HttpResponseStatus.CREATED.code())
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(Json.encode(toDoService.add(item)));

        });
 }

```  
When the user creates a new todo entry in the webpage, a **POST** request is received. The body of this request contains the information of this todo entry as a json string. We decode this json string as a todo item and add it to the todo list and send the repsonse as json string of the created todo item and HTTP Status as **CREATED**. 

Similarly other REST API's have been implemented. So far we are done initializing the CORS handlers on the route and implementing the REST services. What's remaining is to start an HTTP Server. That's what the method call to         startServer() does.

```
private void startServer() {
        vertx.createHttpServer()
                .requestHandler(router::accept)
                .listen(Integer.getInteger("http.port"), System.getProperty("http.address", "0.0.0.0"));
}
```
We create a HttpServer which listens to a port and a host address as set in the system property. We attach a request handler for the server so that for all incoming request to this HttpServer, the router then routes the request to a matching route.

With this done, we can now compile and build our application. But aren't we missing a Main class? Well, we don't have to write one necessarily. Instead, we can use the [Launcher](http://vertx.io/docs/apidocs/io/vertx/core/Launcher.html) main class available in Vert.X Core API. 

##TODO: Package Application

The idea is to package the whole application along with all its dependencies as a single executable jar. We will use the [Apache Maven Shade plugin](https://maven.apache.org/plugins/maven-shade-plugin/) to create a shaded executable jar. So let's update [pom.xml](https://github.com/Ashwin-Surana/to-do-backend/blob/master/pom.xml) to use this plugin for packaging.

```
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <version>2.4.3</version>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>shade</goal>
            </goals>
            <configuration>
                <transformers>
                    <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                        <manifestEntries>
                            <Main-Class>io.vertx.core.Launcher</Main-Class>
                            <Main-Verticle>io.vertx.example.todo.verticles.ToDoVerticle</Main-Verticle>
                        </manifestEntries>
                    </transformer>
                    <transformer implementation="org.apache.maven.plugins.shade.resource.AppendingTransformer">
                        <resource>META-INF/services/io.vertx.core.spi.VerticleFactory</resource>
                    </transformer>
                </transformers>
                <artifactSet />
                <outputFile>${project.build.directory}/${project.artifactId}-${project.version}-fat.jar</outputFile>
            </configuration>
        </execution>
    </executions>
</plugin>
```
In the `manifestEntries`, we have  Main class and the ToDoVerticle. To package the application, navigate to the directory where **pom.xml** is present and run the following command 
```
mvn package
```
This should generate a fat jar in the target directory. Now we can execute the application and test it with the todobackend client.

##TODO: Execute

To execute the fat jar, use the following command
```
java -Dhttp.port=8000 -jar to-do-list-1.0-SNAPSHOT-fat.jar
```
We are setting the system property http.port to be 8000, on which the HttpServer will listen.The application should execute and run without any error and the `ToDoVerticle` should get deployed. Finally, we have the application up and running. Time for some testing! Navigate to this [site](http://www.todobackend.com/specs/index.html) and paste the link `http://localhost:8000/todo` in the text field and run the tests.

[NOTE The above link assumes that you are executing the application in your own machine (i.e. localhost). If that's not the case, modify the link to your server's address.]

If all the test cases pass, cheers! You have successfully built your first web application using Vert.X. 

To see the application in action, we make use of the client provided by the todobackend site. Open this [site](http://www.todobackend.com/client/index.html), paste the link `http://localhost:8000/todo` and enjoy the app.

That's all folks!
 


