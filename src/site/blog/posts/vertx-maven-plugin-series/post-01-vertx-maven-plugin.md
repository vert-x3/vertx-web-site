---
title: Getting started with new Vertx Maven Plugin
date: 2016-12-07
template: post.html
draft: true
author: kameshsampath
---

The all new [Vertx Maven Plugin](http://vmp.fabric8.io) allows you to setup, package, run, start, stop and redeploy easily with a very little configuration resulting in a less verbose `pom.xml`.

Traditionally Vertx applications using maven as build tool need to have one or more of the following plugins,
*  [Maven Shade Plugin](https://maven.apache.org/plugins/maven-shade-plugin/) - aids in packaging a uber jar of vertx application with additional configurations to perform SPI combining, MANIFEST.MF entries etc.,
*  [Maven Exec Plugin](http://www.mojohaus.org/exec-maven-plugin/) - aids in starting the vert.x application
*  [Maven Ant Plugin](https://maven.apache.org/plugins/maven-ant-plugin/) - aids in stopping the running vert.x application

Though these are great plugins and does what is required, but end of the day the developer is left with a verbose `pom.xml` which might become harder to maintain as the application or its configuration grows, even if we decide to go this way and use the plugins, there are somethings like the one listed below which can't done or done easily,
* `run` application on foreground - which is a typical way during development where the application starts in foreground of maven build and killed automatically once we it `Ctrl + c`
* `redeploy` - one of the coolest feature of Vertx allowing us to perform hot deployments, still we can manage to do this with IDE support but not natively using maven - typically cases where we disable Automatic Builds via IDE
* `setup` Vertx applications with sane defaults and required Vertx dependencies e.g. vertx-core

In this first blog of Vertx Maven Plugin series we will help you to get started with this new [Vertx Maven Plugin](http://vmp.fabric8.io), highlighting how this plugin helps alleviating the aforementioned pain points with a less verbose `pom.xml`.

The maven plugin source code is available at [github](https://github.io/fabric8io/vertx-maven-plugin) with maven plugin documentation available at [Vertx maven plugin](http://vmp.fabric8.io)

The source code of the examples used in this blog are available at [github](https://github.io/kameshsampath/vmp-blog)

## Let's setup it up

Its very easy to setup and get started, lets say you have project called _vmp-blog_ with the following content as part of `pom.xml`

<script src="https://gist.github.com/kameshsampath/0e0cfc90ea3cb9d69553ee9901dfd796.js"></script>

from the project directory just run the following command,

```bash
mvn io.fabric8:vertx-maven-plugin:1.0.0:setup
```

On successfull execution of the above command the project _vmp-blog_'s `pom.xml` will be updated as shown below,
<script src="https://gist.github.com/kameshsampath/3c2e96d98f1e16d0f7a0501c05ce0d12.js"></script>

The command did the following for you on the project:

* added couple of properties
  * `fabric8.vertx.plugin.version`  - the latest vert.x maven plugin version
  * `vertx.version` - the latest Vertx framework version
* add the Vertx dependency BOM  and vertx-core dependency corresponding to `vertx.version`
* add `vertx-maven-plugin` with a single execution for goals [initalize](https://vmp.fabric8.io/#vertx:initalize) and [package](https://vmp.fabric8.io/#vertx:package)

The source code until this step is available in [here](https://github.com/kameshsampath/vmp-blog/tree/setup)

Voilà you are now all set to go with your Vertx application building with maven!!

## Let's package it

Now we have set our project to use `vertx-maven-plugin`, lets now add a simple verticle and package the Vertx application as typicall *uber* jar in Vertx world we call them as *fat* jar.  The source code of this section is available [here](https://github.com/kameshsampath/vmp-blog/tree/package).

To make package work correctly we need to add property called `vertx.verticle`, which will be used by the vertx-maven-plugin to set the `Main-Verticle` attribute of the `MANIFEST.MF`.  Please refer to the [package](https://vmp.fabric8.io/#vertx:package) of the vertx-maven-plugin for other possible configurations.  There is also a [examples](https://vmp.fabric8.io/#vertx:examples) section of the vertx-maven-plugin which provides various samples snippets.

The updated `pom.xml` with added property `vertx-maven-plugin` is shown below,

[NOTE Only updated section is shown below, rest of the pom.xml is same as above]

<script src="https://gist.github.com/kameshsampath/24a1ed6a377b118f06af2c4b4ddf0ca0.js"></script>

To package the Vertx application, run the following maven command from the project,
```bash
mvn clean package
```
On successful run of the above command you should see the file with name `${project.finalName}.jar` created in the `${project.build.directory}`, you could now do the following to start and run the Vertx application.
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

In the next part of this series we will see on the other features of the vertx-maven-plugin.
