var dateformat = require("dateformat");
var filesize = require("filesize");
var fs = require("fs");
var request = require("request");
var Q = require("q");

var ARTIFACT_URL = "https://bintray.com/artifact/download/vertx/downloads/"

var TEMPLATE_MIN_TAR_GZ  = "vert.x-{{version}}.tar.gz";
var TEMPLATE_MIN_ZIP     = "vert.x-{{version}}.zip";
var TEMPLATE_FULL_TAR_GZ = "vert.x-{{version}}-full.tar.gz";
var TEMPLATE_FULL_ZIP    = "vert.x-{{version}}-full.zip";
var TEMPLATE_HTML_ZIP    = "vertx-{{version}}-html.zip";

var DATE_FORMAT = "mmm dS, yyyy";

var stat = Q.denodeify(fs.stat);
var readFile = Q.denodeify(fs.readFile);
var writeFile = Q.denodeify(fs.writeFile);

/**
 * Load a JSON file or return an empty object if it does not
 * exists or if it contains syntax errors
 */
function loadInfo(file) {
  return readFile(file).then(function(contents) {
    var json;
    try {
      json = JSON.parse(contents);
    } catch (e) {
      // ignore
    }
    return json || {};
  }).catch(function(err) {
    if (err.code === "ENOENT") {
      // file does not exist
      return {};
    }
    throw err;
  });
}

function templateToFilename(template, version) {
  return template.replace(/\{\{\s*version\s*\}\}/, version);
}

/**
 * Get information about a distribution package
 * @param template the template for the package name
 * @param version the distribution version
 * @return an object containing the package's file size in bytes and the
 * release date
 */
function getFileInfo(template, version) {
  var url = ARTIFACT_URL + templateToFilename(template, version);
  var deferred = Q.defer();
  request({ url: url, method: "HEAD" }, function(error, response) {
    if (error) {
      deferred.reject(error);
    } else if (response.statusCode != 200) {
      deferred.reject("Could not get file size of " + url + " (status code: " +
        response.statusCode + ")");
    } else {
      deferred.resolve({
        "size": response.headers["content-length"],
        "date": new Date(response.headers["last-modified"])
      });
    }
  });
  return deferred.promise;
}

/**
 * Generate distribution info object
 * @param version the distribution version
 */
function generateInfo(version) {
  return Q.all([
    getFileInfo(TEMPLATE_MIN_TAR_GZ, version),
    getFileInfo(TEMPLATE_MIN_ZIP, version),
    getFileInfo(TEMPLATE_FULL_TAR_GZ, version),
    getFileInfo(TEMPLATE_FULL_ZIP, version),
    getFileInfo(TEMPLATE_HTML_ZIP, version)
  ]).spread(function(infoMinTarGz, infoMinZip, infoFullTarGz, infoFullZip, infoHtmlZip) {
    infoMinTarGz.size = filesize(infoMinTarGz.size);
    infoMinZip.size = filesize(infoMinZip.size);
    infoFullTarGz.size = filesize(infoFullTarGz.size);
    infoFullZip.size = filesize(infoFullZip.size);
    infoHtmlZip.size = filesize(infoHtmlZip.size);

    infoMinTarGz.date = dateformat(infoMinTarGz.date, DATE_FORMAT);
    infoMinZip.date = dateformat(infoMinZip.date, DATE_FORMAT);
    infoFullTarGz.date = dateformat(infoFullTarGz.date, DATE_FORMAT);
    infoFullZip.date = dateformat(infoFullZip.date, DATE_FORMAT);
    infoHtmlZip.date = dateformat(infoHtmlZip.date, DATE_FORMAT);

    return {
      "min": [{
        "name": templateToFilename(TEMPLATE_MIN_TAR_GZ, version),
        "version": version,
        "size": infoMinTarGz.size,
        "date": infoMinTarGz.date,
        "ext": ".tar.gz"
      }, {
        "name": templateToFilename(TEMPLATE_MIN_ZIP, version),
        "version": version,
        "size": infoMinZip.size,
        "date": infoMinZip.date,
        "ext": ".zip"
      }],
      "full": [{
        "name": templateToFilename(TEMPLATE_FULL_TAR_GZ, version),
        "version": version,
        "size": infoFullTarGz.size,
        "date": infoFullTarGz.date,
        "ext": ".tar.gz"
      }, {
        "name": templateToFilename(TEMPLATE_FULL_ZIP, version),
        "version": version,
        "size": infoFullZip.size,
        "date": infoFullZip.date,
        "ext": ".zip"
      }],
      "html": [{
        "name": templateToFilename(TEMPLATE_HTML_ZIP, version),
        "version": version,
        "size": infoHtmlZip.size,
        "date": infoHtmlZip.date,
        "ext": ".zip"
      }]
    };
  });
}

/**
 * Save distribution info to a file
 */
function saveInfo(info, file) {
  info = JSON.stringify(info, undefined, 2);
  return writeFile(file, info).then(function() {
    return info;
  });
}

module.exports = function(version, target, done) {
  loadInfo(target).then(function(di) {
    if (di[version]) {
      return di[version];
    }
    return generateInfo(version).then(function(generatedInfo) {
      di[version] = generatedInfo;
      return saveInfo(di, target).then(function(savedDi) {
        return generatedInfo;
      });
    });
  }).nodeify(done);
};
