# Vert.x 3.x web-site

## Viewing the web-site during development

This project comes with a simple web server so you can view the site easily during development.

The web-server is in the Maven sub-module `dev-web-server`.

To build it:

    cd dev-web-server
    mvn package

Run it from the web site project root:

    cd ..
    java -jar dev-web-server/target/dev-web-server-3.0.0-SNAPSHOT-fat.jar

Now build the site:

    mvn site

And point your browser at `localhost:8080`

