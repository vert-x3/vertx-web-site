---
title: Unit and Integration Tests
template: post.html
date: 2015-08-03
author: cescoffier
---

## Previously in "introduction to vert.x"

Let's refresh our mind about what we developed so far in the _introduction to vert.x_ series. In [the first post]({{ site_url }}blog/my-first-vert-x-3-application/), we developed a very simple Vert.x 3 application, and saw how this application can be tested, packaged and executed. In [the second post]({{ site_url }}blog/vert-x-application-configuration/), we saw how this application became configurable and how we can use a random port in test, and use another configurable port in production. Finally, the [previous post]({{ site_url }}blog/some-rest-with-vert-x/) has shown how to use vertx-web and how to implement a small REST API. However, we forgot an important task. We didn't test the API. In this post we will increase the confidence we have on this application by implementing unit and integration tests.

The code of this post is available in the [post-4 branch](https://github.com/cescoffier/my-vertx-first-app/tree/post-4) of the [project](https://github.com/cescoffier/my-vertx-first-app). The starting post, however is the code available in the [post-3 branch](https://github.com/cescoffier/my-vertx-first-app/tree/post-3).

## Tests, Tests, Tests...

This post is mainly about tests. We distinguish two types of tests: unit tests and integration tests. Both are equally important, but have different focus. Unit tests ensure that one _component_ of your application, generally a class in the Java world, behaves as expected. The application is not tested as a whole, but pieces by pieces. Integration tests are more _black box_ in the sense that the application is started and tested generally externally.

In this post we are going to start with some more unit tests as a warm up session and then focus on integration tests. If you already implemented integration tests, you may be a bit scared, and it makes sense. But don't worry, with Vert.x there are no hidden surprises.

## Warmup: Some more unit tests

Let's start slowly. Remember in the first post we have implemented a unit test with [vertx-unit](http://vertx.io/docs/vertx-unit/java/).  The test we did is dead simple:

1. we started the application before the test
2. we checks that it replies "Hello"

Just to refresh your mind, let's have a look at the [code](https://github.com/cescoffier/my-vertx-first-app/blob/post-4/src/test/java/io/vertx/blog/first/MyFirstVerticleTest.java)

```java
@Before
public void setUp(TestContext context) throws IOException {
  vertx = Vertx.vertx();
  ServerSocket socket = new ServerSocket(0);
  port = socket.getLocalPort();
  socket.close();
  DeploymentOptions options = new DeploymentOptions()
      .setConfig(new JsonObject().put("http.port", port)
      );
  vertx.deployVerticle(MyFirstVerticle.class.getName(), options, context.asyncAssertSuccess());
}
```

The `setUp` method is invoked before each test (as instructed by the `@Before` annotation). It, first, creates a new instance of Vert.x. Then, it gets a free port and then deploys our verticle with the right configuration. Thanks to the `context.asyncAssertSuccess()` it waits until the successful deployment of the verticle.

The `tearDown` is straightforward and just closes the Vert.x instance. It automatically un-deploys the verticles:

```java
@After
public void tearDown(TestContext context) {
  vertx.close(context.asyncAssertSuccess());
}
```

Finally, our single test is:

```java
@Test
public void testMyApplication(TestContext context) {
  final Async async = context.async();
  vertx.createHttpClient().getNow(port, "localhost", "/", response -> {
    response.handler(body -> {
      context.assertTrue(body.toString().contains("Hello"));
      async.complete();
    });
  });
 }
```
It is only checking that the application replies "Hello" when we emit a HTTP request on `/`.

Let's now try to implement some unit tests checkin that our web application and the REST API behave as expected. Let's start by checking that the `index.html` page is correctly served. This test is very similar to the previous one:

```java
@Test
public void checkThatTheIndexPageIsServed(TestContext context) {
  Async async = context.async();
  vertx.createHttpClient().getNow(port, "localhost", "/assets/index.html", response -> {
    context.assertEquals(response.statusCode(), 200);
    context.assertEquals(response.headers().get("content-type"), "text/html");
    response.bodyHandler(body -> {
      context.assertTrue(body.toString().contains("<title>My Whisky Collection</title>"));
      async.complete();
    });
  });
}
```

We retrieve the `index.html` page and check:

1. it's there (status code 200)
2. it's a HTML page (content type set to "text/html")
3. it has the right title ("My Whisky Collection")

[NOTE Retrieving content | As you can see, we can test the status code and the headers directly on the HTTP response, but ensure that the body is right, we need to retrieve it. This is done with a body handler that receives the complete body as parameter. Once the last check is made, we release the `async` by calling `complete`.]

Ok, great, but this actually does not test our REST API. Let's ensure that we can add a bottle to the collection. Unlike the previous tests, this one is using `post` to _post_ data to the server:

```java
@Test
public void checkThatWeCanAdd(TestContext context) {
  Async async = context.async();
  final String json = Json.encodePrettily(new Whisky("Jameson", "Ireland"));
  final String length = Integer.toString(json.length());
  vertx.createHttpClient().post(port, "localhost", "/api/whiskies")
      .putHeader("content-type", "application/json")
      .putHeader("content-length", length)
      .handler(response -> {
        context.assertEquals(response.statusCode(), 201);
        context.assertTrue(response.headers().get("content-type").contains("application/json"));
        response.bodyHandler(body -> {
          final Whisky whisky = Json.decodeValue(body.toString(), Whisky.class);
          context.assertEquals(whisky.getName(), "Jameson");
          context.assertEquals(whisky.getOrigin(), "Ireland");
          context.assertNotNull(whisky.getId());
          async.complete();
        });
      })
      .write(json)
      .end();
}
```

First we create the content we want to add. The server consumes JSON data, so we need a JSON string. You can either write your JSON document manually, or use the Vert.x method (`Json.encodePrettily`) as done here. Once we have the content, we create a `post` request. We need to configure some headers to be correctly read by the server. First, we say that we are sending JSON data and we also set the content length. We also attach a response handler very close to the checks made in the previous test. Notice that we can rebuild our object from the JSON document send by the server using the `JSON.decodeValue` method. It's very convenient as it avoids lots of boilerplate code.  At this point the request is not emitted, we need to write the data and call the `end()` method. This is made using `.write(json).end();`.

The order of the methods is important. You cannot _write_ data if you don't have a response handler configured. Finally don't forget to call `end`.

So, let's try this. You can run the test using:

```bash
mvn clean test
```

We could continue writing more unit test like that, but it could become quite complex. Let's see how we could continue our tests using integration tests.

## IT hurts

Well, I think we need to make that clear, integration testing hurts. If you have experience in this area, can you remember how long did it take to setup everything correctly? I get new white hairs by just thinking about it. Why are integration tests more complicated? It's basically because of the setup:

1. We must start the application in a _close to production_ way
2. We must then run the tests (and configure them to hit the right application instance)
3. We must stop the application

That does not sound unconquerable like that, but if you need Linux, MacOS X and Windows support, it quickly get messy. There are plenty of great frameworks easing this such as [Arquillian](http://arquillian.org), but let's do it without any framework to understand how it works.

## We need a battle plan

Before rushing into the complex configuration, let's think a minute about the tasks:

**Step 1 - Reserve a free port**
We need to get a free port on which the application can _listen_, and we need to inject this port in our integration tests.

**Step 2 - Generate the application configuration**
Once we have the free port, we need to write a JSON file configuring the application HTTP Port to this port.

**Step 3 - Start the application**
Sounds easy right? Well it's not that simple as we need to launch our application in a background process.

**Step 4 - Execute the integration tests**
Finally, the central part, run the tests. But before that we should implement some integration tests. Let's come to that later.

**Step 5 - Stop the application**
Once the tests have been executed, regardless if there are failures or errors in the tests, we need to stop the application.

There are multiple way to implement this plan. We are going to use a _generic_ way. It's not necessarily the better, but can be applied almost everywhere. The approach is tight to Apache Maven. If you want to propose an alternative using Gradle or a different tool, I will be happy to add your way to the post.

## Implement the plan

As said above, this section is Maven-centric, and most of the code goes in the [pom.xml](https://github.com/cescoffier/my-vertx-first-app/blob/post-4/pom.xml) file. If you never used the different Maven lifecycle phases, I recommend you to look at the [introduction to the Maven lifecycle](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle.html).

We need to add and configure a couple of plugins. Open the `pom.xml` file and in the `<plugins>` section add:

```xml
<plugin>
  <groupId>org.codehaus.mojo</groupId>
  <artifactId>build-helper-maven-plugin</artifactId>
  <version>1.9.1</version>
  <executions>
    <execution>
      <id>reserve-network-port</id>
      <goals>
        <goal>reserve-network-port</goal>
      </goals>
      <phase>process-sources</phase>
      <configuration>
        <portNames>
          <portName>http.port</portName>
        </portNames>
      </configuration>
    </execution>
  </executions>
</plugin>
```

We use the `build-helper-maven-plugin` (a plugin to know if you are often using Maven) to pick up a free port. Once found, the plugin assigns the `http.port` variable to the picked port. We execute this plugin early in the build (during the `process-sources` phase), so we can use the `http.port` variable in the other plugin. This was for the first step.

Two actions are required for the second step. First, in the `pom.xml` file, just below the `<build>` opening tag, add:

```xml
<testResources>
  <testResource>
    <directory>src/test/resources</directory>
    <filtering>true</filtering>
  </testResource>
</testResources>
```

This instructs Maven to _filter_ resources from the `src/test/resources` directory. _Filter_ means replacing placeholders by actual values. That's exactly what we need as we now have the `http.port` variable. So create the `src/test/resources/my-it-config.json` file with the following content:

```javascript
{
  "http.port": ${http.port}
}
```

This configuration file is similar to the one we did in previous posts. The only difference is the `${http.port}` which is the (default) Maven syntax for filtering. So, when Maven is going to process or file it will replace `${http.port}` by the selected port. That's all for the second step.

The step 3 and 5 are a bit more tricky. We should start and stop the application. We are going to use the `maven-antrun-plugin` to achieve this. In the `pom.xml` file, below the `build-helper-maven-plugin`, add:

```xml
<!-- We use the maven-antrun-plugin to start the application before the integration tests
and stop them afterward -->
<plugin>
  <artifactId>maven-antrun-plugin</artifactId>
  <version>1.8</version>
  <executions>
    <execution>
      <id>start-vertx-app</id>
      <phase>pre-integration-test</phase>
      <goals>
        <goal>run</goal>
      </goals>
      <configuration>
        <target>
          <!--
          Launch the application as in 'production' using the fatjar.
          We pass the generated configuration, configuring the http port to the picked one
          -->
          <exec executable="${java.home}/bin/java"
                dir="${project.build.directory}"
                spawn="true">
            <arg value="-jar"/>
            <arg value="${project.artifactId}-${project.version}-fat.jar"/>
            <arg value="-conf"/>
            <arg value="${project.build.directory}/test-classes/my-it-config.json"/>
          </exec>
        </target>
      </configuration>
    </execution>
    <execution>
      <id>stop-vertx-app</id>
      <phase>post-integration-test</phase>
      <goals>
        <goal>run</goal>
      </goals>
      <configuration>
        <!--
          Kill the started process.
          Finding the right process is a bit tricky. Windows command in in the windows profile (below)
          -->
        <target>
          <exec executable="bash"
                dir="${project.build.directory}"
                spawn="false">
            <arg value="-c"/>
            <arg value="ps ax | grep -Ei '[\-]DtestPort=${http.port}\s+\-jar\s+${project.artifactId}' | awk 'NR==1{print $1}' | xargs kill -SIGTERM"/>
          </exec>
        </target>
      </configuration>
    </execution>
  </executions>
</plugin>
```

That's a huge piece of XML, isn't it ? We configure two executions of the plugin. The first one, happening in the `pre-integration-test` phase, executes a set of bash command to start the application. It basically executes:

```bash
java -jar my-first-app-1.0-SNAPSHOT-fat.jar -conf .../my-it-config.json
```

[NOTE Is the fatjar created ? | The fat jar embedding our application is created in the `package` phase, preceding the `pre-integration-test`, so yes, the fat jar is created.]

As mentioned above, we launch the application as we would in a production environment.

Once, the integration tests are executed (step 4 we didn't look at it yet), we need to stop the application (so in the the `post-integration-test` phase).  To close the application, we are going to invoke some shell magic command to find our process in with the `ps` command and send the `SIGTERM` signal. It is equivalent to:

```bash
ps
.... -> find your process id
kill your_process_id -SIGTERM
```

[NOTE And Windows ? | I mentioned it above, we want Windows to be supported and these commands are not going to work on Windows. Don't worry, Windows configuration is below....]

We should now do the fourth step we (silently) skipped. To execute our integration tests, we use the `maven-failsafe-plugin`. Add the following plugin configuration to your `pom.xml` file:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-failsafe-plugin</artifactId>
  <version>2.18.1</version>
  <executions>
    <execution>
      <goals>
        <goal>integration-test</goal>
        <goal>verify</goal>
      </goals>
      <configuration>
        <systemProperties>
          <http.port>${http.port}</http.port>
        </systemProperties>
      </configuration>
    </execution>
  </executions>
</plugin>
```

As you can see, we pass the `http.port` property as a system variable, so our tests are able to connect on the right port.

That's all! Wow... Let's try this (for windows users, you will need to be patient or to jump to the last section).

```bash
mvn clean verify
```

We should not use `mvn integration-test` because the application would still be running. The `verify` phase is after the `post-integration-test` phase and will analyse the integration-tests results. Build failures because of integration tests failed assertions are reported in this phase.

## Hey, we don't have integration tests !

And that's right, we set up everything, but we don't have a single integration test. To ease the implementation, let's use two libraries: [AssertJ](http://joel-costigliola.github.io/assertj/) and [Rest-Assured](https://github.com/jayway/rest-assured).

AssertJ proposes a set of assertions that you can chain and use fluently. Rest Assured is a framework to test REST API.

In the `pom.xml` file, add the two following dependencies just before `</dependencies>`:

```xml
<dependency>
  <groupId>com.jayway.restassured</groupId>
  <artifactId>rest-assured</artifactId>
  <version>2.4.0</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.assertj</groupId>
  <artifactId>assertj-core</artifactId>
  <version>2.0.0</version>
  <scope>test</scope>
</dependency>
```

Then, create the `src/test/java/io/vertx/blog/first/MyRestIT.java` file. Unlike unit test, integration test ends with `IT`. It's a convention from the Failsafe plugin to distinguish unit (starting or ending with _Test_) from integration tests (starting or ending with _IT_). In the created file add:

```java
package io.vertx.blog.first;

import com.jayway.restassured.RestAssured;
import org.junit.AfterClass;
import org.junit.BeforeClass;

public class MyRestIT {

  @BeforeClass
  public static void configureRestAssured() {
    RestAssured.baseURI = "http://localhost";
    RestAssured.port = Integer.getInteger("http.port", 8080);
  }

  @AfterClass
  public static void unconfigureRestAssured() {
    RestAssured.reset();
  }
}
```

The methods annotated with `@BeforeClass` and `@AfterClass` are invoked once before / after all tests of the class. Here, we just retrieve the http port (passed as a system property) and we configure REST Assured.

[NOTE Am I ready to serve ? | You may need to wait in the `configureRestAssured` method that the HTTP server has been started. We recommend the [awaitility](https://github.com/jayway/awaitility) test framework to check that the request can be served. It would fail the test if the server does not start.]

It's now time to implement a real test. Let's check we can retrieve an individual product:

```java
@Test
public void checkThatWeCanRetrieveIndividualProduct() {
  // Get the list of bottles, ensure it's a success and extract the first id.
  final int id = get("/api/whiskies").then()
      .assertThat()
      .statusCode(200)
      .extract()
      .jsonPath().getInt("find { it.name=='Bowmore 15 Years Laimrig' }.id");
  // Now get the individual resource and check the content
  get("/api/whiskies/" + id).then()
      .assertThat()
      .statusCode(200)
      .body("name", equalTo("Bowmore 15 Years Laimrig"))
      .body("origin", equalTo("Scotland, Islay"))
      .body("id", equalTo(id));
}
```

Here you can appreciate the power and expressiveness of Rest Assured. We retrieve the list of product, ensure the response is correct, and extract the _id_ of a specific bottle using a JSON (Groovy) Path expression.

Then, we try to retrieve the metadata of this individual product, and check the result.

Let's now implement a more sophisticated scenario. Let's add and delete a product:

```java
@Test
public void checkWeCanAddAndDeleteAProduct() {
  // Create a new bottle and retrieve the result (as a Whisky instance).
  Whisky whisky = given()
      .body("{\"name\":\"Jameson\", \"origin\":\"Ireland\"}").request().post("/api/whiskies").thenReturn().as(Whisky.class);
  assertThat(whisky.getName()).isEqualToIgnoringCase("Jameson");
  assertThat(whisky.getOrigin()).isEqualToIgnoringCase("Ireland");
  assertThat(whisky.getId()).isNotZero();
  // Check that it has created an individual resource, and check the content.
  get("/api/whiskies/" + whisky.getId()).then()
      .assertThat()
      .statusCode(200)
      .body("name", equalTo("Jameson"))
      .body("origin", equalTo("Ireland"))
      .body("id", equalTo(whisky.getId()));
  // Delete the bottle
  delete("/api/whiskies/" + whisky.getId()).then().assertThat().statusCode(204);
  // Check that the resource is not available anymore
  get("/api/whiskies/" + whisky.getId()).then()
      .assertThat()
      .statusCode(404);
}
```
So, now we have integration tests let's try:

```bash
mvn clean verify
```

Simple no? Well, simple once the setup is done right... You can continue implementing other integration tests to be sure that everything behave as you expect.

## Dear Windows users...

This section is the bonus part for Windows user, or people wanting to run their integration tests on Windows machine too. The command we execute to stop the application is not going to work on Windows. Luckily, it's possible to extend the `pom.xml` with a profile executed on Windows.

In your `pom.xml`, just after `</build>`, add:

```xml
<profiles>
  <!-- A profile for windows as the stop command is different -->
  <profile>
    <id>windows</id>
    <activation>
      <os>
        <family>windows</family>
      </os>
    </activation>
    <build>
      <plugins>
        <plugin>
          <artifactId>maven-antrun-plugin</artifactId>
          <version>1.8</version>
          <executions>
            <execution>
              <id>stop-vertx-app</id>
              <phase>post-integration-test</phase>
              <goals>
                <goal>run</goal>
              </goals>
              <configuration>
                <target>
                  <exec executable="wmic"
                      dir="${project.build.directory}"
                      spawn="false">
                    <arg value="process"/>
                    <arg value="where"/>
                    <arg value="CommandLine like '%${project.artifactId}%' and not name='wmic.exe'"/>
                    <arg value="delete"/>
                  </exec>
                </target>
              </configuration>
            </execution>
          </executions>
        </plugin>
      </plugins>
    </build>
  </profile>
</profiles>
```

This profile replaces the actions described above to stop the application with a version working on windows. The profile is automatically enabled on Windows. As on others operating systems, execute with:

```bash
mvn clean verify
```

## Conclusion

Wow, what a trip ! We are done... In this post we have seen how we can gain confidence in Vert.x applications by implementing both unit and integration tests. Unit tests, thanks to vert.x unit, are able to check the asynchronous aspect of Vert.x application, but could be complex for large scenarios. Thanks to Rest Assured and AssertJ, integration tests are dead simple to write... but the setup is not straightforward. This post have shown how it can be configured easily. Obviously, you could also use AssertJ and Rest Assured in your unit tests.

In the [next post](http://vertx.io/blog/using-the-asynchronous-sql-client/), we replace the _in memory_ backend with a database, and use asynchronous integration with this database.

Stay Tuned & Happy Coding !
