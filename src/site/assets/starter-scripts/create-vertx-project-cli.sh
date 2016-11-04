#!/usr/bin/env bash

export PROJECT_NAME="vertx-starter"

# Read project name
read -p "What's the name of your project? [$PROJECT_NAME] : " projectName
if [ ${#projectName} -ge 1 ]; then PROJECT_NAME=$projectName;
fi

echo "Cloning project"
git clone https://github.com/vert-x3/vertx-cli-starter.git ${PROJECT_NAME}

echo "Generating project"
rm -Rf ${PROJECT_NAME}/.git


echo "======================================"
echo " To check your generated project run:"
echo "     cd $PROJECT_NAME"
echo "     ./vertx.sh run src/io/vertx/starter/MainVerticle.java"
echo " and open your browser to 'http://localhost:8080'"
echo " Happy coding !"
echo "======================================"
