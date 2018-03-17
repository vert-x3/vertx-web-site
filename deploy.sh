#!/bin/sh
echo "Deploying web site"
cd target  || exit -1
rm -Rf scmpublish-checkout
git clone --depth=1 --branch master git@github.com:vert-x3/vert-x3.github.io.git scmpublish-checkout
echo "Updating checkout directory with actual content in target/site"
mkdir scmpublish-checkout/preview
cp -R site/* scmpublish-checkout/preview/
cd scmpublish-checkout  || exit -1
git add -A
git commit -m "update web site"
git push origin master
