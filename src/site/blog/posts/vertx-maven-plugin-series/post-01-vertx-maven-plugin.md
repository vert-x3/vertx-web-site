---
title: Getting started with new fabric8 Vert.x Maven Plugin
date: 2016-12-07
draft: true
template: post.html
author: kameshsampath
---

The all new [fabric8 Vert.x Maven Plugin](http://vmp.fabric8.io) allows you to setup, package, run, start, stop and redeploy easily with a very little configuration resulting in a less verbose `pom.xml`.

Traditionally Vert.x applications using [Apache Maven](http://maven.apache.org) need to have one or more of the following plugins,
*  [Maven Shade Plugin](https://maven.apache.org/plugins/maven-shade-plugin/) - aids in packaging a uber jar of Vert.x application with additional configurations to perform SPI combining, MANIFEST.MF entries etc.,
*  [Maven Exec Plugin](http://www.mojohaus.org/exec-maven-plugin/) - aids in starting the Vert.x application
*  [Maven Ant Plugin](https://maven.apache.org/plugins/maven-ant-plugin/) - aids in stopping the running Vert.x application

Though these are great plugins and does what is required, but end of the day the developer is left with a verbose `pom.xml` which might become harder to maintain as the application or its configuration grows, even if we decide to go this way and use the plugins, there are somethings like the one listed below which can't done or done easily,
* `run` application on foreground - which is a typical way during development where the application starts in foreground of [Apache Maven](http://maven.apache.org) build and killed automatically once we it `Ctrl + c`(or `CMD + c` on Mac)
* `redeploy` - one of the coolest feature of Vert.x allowing us to perform hot deployments, still we can manage to do this with IDE support but not natively using [Apache Maven](http://maven.apache.org) - typically cases where we disable Automatic Builds via IDE
* `setup` Vert.x applications with sensible defaults and required Vert.x dependencies e.g. vertx-core

In this first blog of fabric8 Vert.x Maven Plugin series we will help you to get started with this new [fabric8 Vert.x Maven Plugin](http://vmp.fabric8.io), highlighting how this plugin helps alleviating the aforementioned pain points with a less verbose `pom.xml`.

The [Apache Maven](http://maven.apache.org) plugin source code is available at [github](https://github.com/fabric8io/vertx-maven-plugin) with [Apache Maven](http://maven.apache.org) plugin documentation available at [fabric8 Vert.x Maven Plugin](http://vmp.fabric8.io)

The source code of the examples used in this blog are available at [github](https://github.com/kameshsampath/vmp-blog)

## Let's set it up

Its very easy to setup and get started, lets say you have project called _vmp-blog_ with the following content as part of `pom.xml`

<script src="https://gist.github.com/kameshsampath/0e0cfc90ea3cb9d69553ee9901dfd796.js"></script>

from the project directory just run the following command,

```bash
mvn io.fabric8:vertx-maven-plugin:1.0.0:setup
```

On successfull execution of the above command the project's `pom.xml` will be updated as shown below,
<script src="https://gist.github.com/kameshsampath/3c2e96d98f1e16d0f7a0501c05ce0d12.js"></script>

The command did the following for you on the project:

* added couple of properties
  * `fabric8.vertx.plugin.version`  - the latest fabric8 vert.x maven plugin version
  * `vertx.version` - the latest Vert.x framework version
* add the Vert.x dependency BOM  and vertx-core dependency corresponding to `vertx.version`
* add `vertx-maven-plugin` with a single execution for goals [initialize](https://vmp.fabric8.io/#vertx:initalize) and [package](https://vmp.fabric8.io/#vertx:package)

The source code until this step is available in [here](https://github.com/kameshsampath/vmp-blog/tree/setup)

Voilà, you are now all set to go with your Vert.x application building with [Apache Maven](http://maven.apache.org)!!

## Let's package it

Now we have set our project to use `vertx-maven-plugin`, lets now add a simple verticle and package the Vert.x application as typicall *uber* jar in Vert.x world we call them as *fat* jar.  The source code of this section is available [here](https://github.com/kameshsampath/vmp-blog/tree/package).

To make package work correctly we need to add property called `vertx.verticle`, which will be used by the vertx-maven-plugin to set the `Main-Verticle` attribute of the `MANIFEST.MF`.  Please refer to the [package](https://vmp.fabric8.io/#vertx:package) of the vertx-maven-plugin for other possible configurations.  There is also a [examples](https://vmp.fabric8.io/#vertx:examples) section of the vertx-maven-plugin which provides various samples snippets.

The updated `pom.xml` with added property `vertx-maven-plugin` is shown below,

[NOTE Only updated section is shown below, rest of the pom.xml is same as above]

<script src="https://gist.github.com/kameshsampath/24a1ed6a377b118f06af2c4b4ddf0ca0.js"></script>

To package the Vert.x application, run the following [Apache Maven](http://maven.apache.org) command from the project,
```bash
mvn clean package
```
On successful run of the above command you should see the file with name `${project.finalName}.jar` created in the `${project.build.directory}`, you could now do the following to start and run the Vert.x application.
```bash
java -jar ${project.build.directory}/${project.finalName}.jar
```

The generated `MANIFEST.MF` file is as shown below,

```
Main-Class                               io.vertx.core.Launcher
Main-Verticle                            io.fabric8.blog.MainVerticle
Manifest-Version                         1.0
```

The source code until this step is available in [here](https://github.com/kameshsampath/vmp-blog/tree/package)

### SPI Combination

The package goal by default does SPI combination, lets say you have a service file called `com.fasterxml.jackson.core.JsonFactory` in `${project.basedir}/src/main/resources/META-INF/services` with contents as shown below,

```
foo.bar.baz.MyImpl
${combine}
```

During package if the [fabric8 Vert.x Maven Plugin](http://vmp.fabric8.io) finds another `com.fasterxml.jackson.core.JsonFactory` service definition file within the project dependencies with content _foo.bar.baz2.MyImpl2_, then it merges the content into `com.fasterxml.jackson.core.JsonFactory` of `${project.basedir}/src/main/resources/META-INF/services`, resulting in a content as shown below,

```
foo.bar.baz.MyImpl
foo.bar.baz2.MyImpl2
```

The position of `${combine}` controls the ordering of the merge, since we added `${combine}` below _foo.bar.baz.MyImpl_ all other SPI definitions will be appended below _foo.bar.baz.MyImpl_

## What's next ?

It's good have the jar packaged and run using `java -jar uber-jar`, but when doing typical development you don't  want to do frequent [Apache Maven](http://maven.apache.org) packaging and wish to see your changes automatically redeployed.

Don't worry!!! As part of [fabric8 Vert.x Maven Plugin](http://vmp.fabric8.io) we have added the incremental builder to [Apache Maven](http://maven.apache.org) build, which will watch for your source and resource changes to perform automatic re-build and delegate the redeployment to Vert.x.

Run,redeploy and other features of the [fabric8 Vert.x Maven Plugin](http://vmp.fabric8.io) will be explored in detail in the next part of this series, until the have fun with [fabric8 Vert.x Maven Plugin](http://vmp.fabric8.io)!!
