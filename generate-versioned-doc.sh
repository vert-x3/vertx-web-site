#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Copy the existing docs into a directory under /docs/<version>. Links are updated to target this version"
    echo "Usage: ./generate-versioned-doc.sh <version>"
    echo "For example: ./generate-versioned-doc.sh 3.5.0"
    echo "Once copied, run ./deploy.sh to update the web site (do not regenerate the site in between)"
    exit -1
fi

export VERSION=$1
export DOCS="target/site/docs"
export COPY="target/copy-docs-${VERSION}"
export REF="https\://vertx.io/docs"
export PACKAGE_NAME="vertx-docs-${VERSION}.zip"

echo "Generating doc package for ${VERSION}"
echo "Generating web site"
mvn clean site
echo "Extracting /docs"
mkdir -p "${COPY}"
cp -R $DOCS "${COPY}"
find "${COPY}" -name "*.html" -type f -print0 | xargs -0 sed -i -e "s:${REF}:${REF}/${VERSION}:g"
find "${COPY}" -name "*.html-e" -exec rm -Rf {} \;
mkdir -p "${DOCS}/${VERSION}"

#echo "Creating archive"
#zip -r "${PACKAGE_NAME}" "${COPY}"
#echo "Archive created: vertx-docs-${VERSION}.zip"
echo "Copying content to site"
cp -R "${COPY}/docs/" "${DOCS}/${VERSION}"
echo "Now, just launch ./deploy.sh"

