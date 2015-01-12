# Vert.x 3.x web-site

## Viewing the web-site during development

This project comes with a simple web server so you can view the site easily during development.

The web-server is in the Maven sub-module `dev-web-server`.

To build it:

    cd dev-web-server
    mvn package

Run it from the web site project root:

    java -jar dev-web-server/target/dev-web-server-3.0.0-SNAPSHOT-fat.jar

Now point your browser at localhost:8080

