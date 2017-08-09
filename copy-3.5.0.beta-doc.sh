#!/bin/sh
 
 # Script used to copy the 3.5.0 beta documentation to the right directory.
 
 VERSION=3.5.0.Beta1
 DIR=target/beta
 # Should be replaced by http://repo1.maven.org/maven2 when the release is on maven central
 REPO=https://oss.sonatype.org/content/repositories/iovertx-3687
 
 rm -Rf ${DIR}
 rm -Rf target/docs/${VERSION}
 
 mkdir -p target/beta
 mkdir -p target/docs/${VERSION}
 
 cd target/beta
 
 wget -O docs.zip ${REPO}/io/vertx/vertx-stack-docs/${VERSION}/vertx-stack-docs-${VERSION}-docs.zip 
 unzip docs.zip
 rm docs.zip
 mv * ../docs/${VERSION}