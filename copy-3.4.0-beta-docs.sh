#!/bin/sh

# Script used to copy the 3.4.0 beta documentation to the right directory.

VERSION=3.4.0.Beta1
DIR=target/beta

rm -Rf ${DIR}
rm -Rf target/docs/${VERSION}

mkdir -p target/beta
mkdir -p target/docs/${VERSION}

cd target/beta

wget -O docs.zip http://repo1.maven.org/maven2/io/vertx/vertx-stack-docs/${VERSION}/vertx-stack-docs-${VERSION}-docs.zip
unzip docs.zip
rm docs.zip
wget -O docs.zip http://repo1.maven.org/maven2/io/vertx/vertx-mqtt-server/${VERSION}/vertx-mqtt-server-${VERSION}-docs.zip
mkdir vertx-mqtt-server
unzip -d vertx-mqtt-server docs.zip
wget -O docs.zip http://repo1.maven.org/maven2/io/vertx/vertx-kafka-client/${VERSION}/vertx-kafka-client-${VERSION}-docs.zip
mkdir vertx-kafka-client
unzip -d vertx-kafka-client docs.zip
rm docs.zip
mv * ../docs/${VERSION}/
