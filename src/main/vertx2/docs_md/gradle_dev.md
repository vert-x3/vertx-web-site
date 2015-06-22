<!--
This work is licensed under the Creative Commons Attribution-ShareAlike 3.0 Unported License.
To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/3.0/ or send
a letter to Creative Commons, 444 Castro Street, Suite 900, Mountain View, California, 94041, USA.
-->

[TOC]

# Developing Vert.x modules with Gradle

In this guide we'll show you how to develop a Vert.x project using Gradle.

# Clone the template project

We provide a template [Gradle project](https://github.com/vert-x/vertx-gradle-template) which you can clone to get you started.

Clone it locally

    git clone https://github.com/vert-x/vertx-gradle-template.git my-vertx-module

Where `my-vertx-module` is the name you want to give your project.

Remove the origin

    git remote rm origin

And add your new origin

    git remote add origin <path to your repo>

Let's run the tests to make sure everything is working

    cd my-vertx-module
    ./gradlew test

You should use the Gradle Wrapper (`./gradlew`) to run all Gradle tasks. You do not need to install Gradle manually. Take a look at `build.gradle` for a list of the available tasks.

# Outputs

The outputs of the project are:

* The Vert.x module zip file.
* A jar that corresponds to the module will also be produced. This is useful when you have another project which depends on the classes from your module, as it allows you to add it as a standard Gradle build dependency in your other project.

The outputs are created in the `build` directory as per normal.

# Configuring the project

You configure many things in `gradle.properties`:

* `modowner`, `modname` and `version` determine the name of the module as described in the [modules manual](mods_manual.html#mod-id)

* `pullInDeps` determines whether all module dependencies should be packaged into the module as [nested modules](mods_manual.html#nested-mods). 

It also contains various properties used to configure versions of various dependencies.

# Overriding default Vert.x configuration

If you want to override any Vert.x platform configuration, e.g. `langs.properties`, `cluster.xml` or logging configuration, you can add those files to the directory `src/main/platform_lib` - these will then be added to the Vert.x platform classpath when you run the module with `./gradlew runMod`


# Other useful Gradle tasks

Open `build.gradle` and take a look at the comments there for a list of useful tasks supported by the build script.

# Setup your IDE

You can use the `idea` and `eclipse` Gradle plugins to create the project files for your IDE

    ./gradlew idea

Or

    ./gradlew eclipse

Once the IDE files have been created you can open the project files in your IDE.

Note: You can run the `idea` or `eclipse` tasks again if you change your project dependencies - in this way the IDE project files will be brought up-to-date.

*You may have to tell your IDE to use Java source compatibility level of Java 7, as Gradle seems to default to Java 6 (!)*

# Changing the dependencies of your project

If your project needs a third party jar to build and you want to include it in the `lib` directory of your module you can add the dependency in the `dependencies` section of `build.gradle` with a type of `compile`.

If you don't want it to be included in the `lib` directory you should add it as `provided`.

Once you've changed your dependencies just run `./gradlew idea` or `./gradlew eclipse` again to update your IDE project files with the new dependencies.

# Installing your module in Maven local

Use `./gradlew install` to install your module in your local Maven repository.

# Pushing your module to Maven

Use `./gradlew uploadArchives` as normal to push your module to a Maven repository.

# Registering your module in the Module Registry

If you've pushed your module to a public Maven or Bintray repository you can register it in the [Module Registry](http://modulereg.vertx.io) so others can search for and discover it.


# Next steps

Now you've got the project all set-up and running, it's time to [explore the standard project layout](dev_guide.html) itself.


