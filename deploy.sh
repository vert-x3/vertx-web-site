#!/bin/sh
echo "Deploying web site"
cd target
rm -Rf scmpublish-checkout
git clone --branch master https://github.com/vert-x3/vert-x3.github.io.git scmpublish-checkout
echo "Updating checkout directory with actual content in target/site"
cp -R site/* scmpublish-checkout/
cd scmpublish-checkout
git add -A
git commit -m "update web site"
git push origin master
