#!/usr/bin/env bash

export PROJECT_NAME="vertx-starter"
export VERSION="1.0-SNAPSHOT"

# Read project name
read -p "What's the name of your project? [$PROJECT_NAME] : " projectName
if [ ${#projectName} -ge 1 ]; then PROJECT_NAME=$projectName;
fi

read -p "What's the version of your project? [$VERSION] : " v
if [ ${#v} -ge 1 ]; then VERSION=$v;
fi

echo "Cloning project"
git clone https://github.com/vert-x3/vertx-gradle-starter.git ${PROJECT_NAME}

echo "Generating project"
rm -Rf ${PROJECT_NAME}/.git
sed -i -e "s/1.0-SNAPSHOT/${VERSION}/" ${PROJECT_NAME}/build.gradle

if [ -f "${PROJECT_NAME}/build.gradle-e" ];
then
   rm "${PROJECT_NAME}/build.gradle-e"
fi

echo "======================================"
echo " To check your generated project run:"
echo "     cd $PROJECT_NAME"
echo "     ./gradlew test run"
echo " and open your browser to 'http://localhost:8080'"
echo " Happy coding !"
echo "======================================"
