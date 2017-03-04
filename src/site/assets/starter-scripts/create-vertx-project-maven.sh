#!/usr/bin/env bash

export PROJECT_NAME="vertx-starter"
export GROUP_ID="io.vertx.starter"
export ARTIFACT_ID=$PROJECT_NAME
export VERSION="1.0-SNAPSHOT"

# Read project name
read -p "What's the name of your project? [$PROJECT_NAME] : " projectName
if [ ${#projectName} -ge 1 ]; then PROJECT_NAME=$projectName;
fi

# Read groupID, Artifact id and Version
read -p "What's the groupId of your project? [$GROUP_ID] : " groupId
if [ ${#groupId} -ge 1 ]; then GROUP_ID=$groupId;
fi

read -p "What's the artifactId of your project? [$PROJECT_NAME] : " artifactId
if [ ${#artifactId} -ge 1 ]; then ARTIFACT_ID=$artifactId;
else ARTIFACT_ID=${PROJECT_NAME}
fi

read -p "What's the version of your project? [$VERSION] : " v
if [ ${#v} -ge 1 ]; then VERSION=$v;
fi

echo "Cloning project"
git clone https://github.com/vert-x3/vertx-maven-starter.git ${PROJECT_NAME}

echo "Generating project"
rm -Rf ${PROJECT_NAME}/.git
sed -i -e "s/>io.vertx.starter</>${GROUP_ID}</" ${PROJECT_NAME}/pom.xml
sed -i -e "s/vertx-start-project/${ARTIFACT_ID}/" ${PROJECT_NAME}/pom.xml
sed -i -e "s/1.0-SNAPSHOT/${VERSION}/" ${PROJECT_NAME}/pom.xml

if [ -f "${PROJECT_NAME}/pom.xml-e" ];
then
   rm "${PROJECT_NAME}/pom.xml-e"
fi

echo "======================================"
echo " To check your generated project run:"
echo "     cd $PROJECT_NAME"
echo "     mvn clean test exec:java"
echo " and open your browser to 'http://localhost:8080'"
echo " Happy coding !"
echo "======================================"
