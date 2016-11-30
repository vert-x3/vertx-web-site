var GitHubApi = require("github");
var gutil = require("gulp-util");
var through2 = require("through2");

/**
 * Create a function that collects all elements from a multi-page response
 */
function collector(github, collect, done) {
  var r = function(err, res) {
    if (err) {
      done(err);
      return;
    }

    // check response status
    if (res.meta.status === undefined || /^200.*/.test(res.meta.status)) {
      // call collect method for each entry in the response
      res.forEach(collect);
    } else if (/^204.*/.test(res.meta.status)) {
      // no content
    } else {
      // handle error
      done(res.meta.status);
      return;
    }

    // request next page or finish
    if (github.hasNextPage(res)) {
      github.getNextPage(res, r);
    } else {
      done();
    }
  };
  return r;
}

/**
 * Get all repositories of an organization
 */
function getRepos(org, github, done) {
  var result = [];
  github.repos.getFromOrg({ org: org }, collector(github, function(e) {
    result.push(org + "/" + e.name);
  }, function(err) {
    if (err) {
      done(err);
      return;
    }
    done(null, result);
  }));
}

/**
 * Get repositories of all given organizations
 */
function getAllRepos(orgs, github, done) {
  var orgsClone = orgs.slice(0);
  var allRepos = [];

  var loop = function() {
    if (orgsClone.length === 0) {
      // no more organizations to query
      done(null, allRepos);
      return;
    }

    // get next organization to query
    var org = orgsClone.shift();
    gutil.log(org + " ...");
    getRepos(org, github, function(err, repos) {
      if (err) {
        done(err);
        return;
      }

      allRepos = allRepos.concat(repos);

      // query next organisation
      loop();
    });
  };

  loop();
}

/**
 * Get all people who contributed to a repository and return their login and
 * number of contributions
 */
function getContributors(org, repo, github, done) {
  var result = [];
  github.repos.getContributors({ user: org, repo: repo }, collector(github, function(e) {
    result.push({
      login: e.login,
      contributions: e.contributions || 0
    });
  }, function(err) {
    if (err) {
      done(err);
      return;
    }
    done(null, result);
  }));
}

/**
 * Loop through the given repositories and get the usernames of all contributors
 * and the number of their contributions
 */
function getAllContributors(repos, github, done) {
  var reposClone = repos.slice(0);
  var allContributors = [];

  var loop = function() {
    if (reposClone.length === 0) {
      // no more repositories to query
      done(null, allContributors);
      return;
    }

    // get next repository to query
    var repo = reposClone.shift();
    gutil.log(repo + " ...");

    var sr = repo.split("/");
    var org = sr[0];
    repo = sr[1];
    getContributors(org, repo, github, function(err, contributors) {
      if (err) {
        done(err);
        return;
      }

      // add all contributors of this repository to the result list
      contributors.forEach(function(c) {
        var found = false;
        for (var j = 0; j < allContributors.length; ++j) {
          if (allContributors[j].login === c.login) {
            allContributors[j].contributions += c.contributions;
            found = true;
            break;
          }
        }
        if (!found) {
          allContributors.push(c);
        }
      });

      // query next repository in the list
      loop();
    });
  };

  loop();
}

/**
 * Get details for a given user
 */
function getUserDetails(user, github, done) {
  github.user.getFrom({ user: user }, function(err, data) {
    if (err) {
      done(err);
      return;
    }

    // generate details
    var details = {
      github_id: data.login,
      avatar: data.avatar_url + "&s=80",
      github: data.html_url,
      name: data.name || data.login
    };

    // handle homepage
    if (data.blog) {
      details.homepage = data.blog;
      if (!/^[a-z]+:\/\//.test(details.homepage)) {
        details.homepage = "http://" + details.homepage;
      }
    }

    done(null, details);
  });
}

/**
 * Get details of all given users
 */
function getAllUserDetails(users, github, done) {
  var usersClone = users.slice(0);
  var allUsers = [];

  var loop = function() {
    if (usersClone.length == 0) {
      // no more users to query
      done(null, allUsers);
      return;
    }

    // get next user to query
    var user = usersClone.shift();
    gutil.log(user.login + " ...");

    getUserDetails(user.login, github, function(err, details) {
      if (err) {
        done(err);
        return;
      }

      details.contributions = user.contributions;
      allUsers.push(details);

      // query next user
      loop();
    });
  };

  loop();
}

/**
 * Get all Vert.x contributors
 */
function getAll(github, done) {
  // get all repositories of the vert-x and vert-x3 organisations
  var orgs = ["vert-x", "vert-x3"];
  gutil.log("Get all repositories ...")
  getAllRepos(orgs, github, function(err, repos) {
    if (err) {
      done(err);
      return;
    }

    // get contributors from the 'eclipse/vert.x' repository as well
    repos.unshift("eclipse/vert.x");

    // get all contributors
    gutil.log("Get all contributors ...")
    getAllContributors(repos, github, function(err, contributors) {
      if (err) {
        done(err);
        return;
      }

      // query user details of all contributors
      gutil.log("Query user details ...");
      getAllUserDetails(contributors, github, done);
    });
  })
}

module.exports = function(client_id, client_secret) {
  var github = new GitHubApi({ version: "3.0.0" });

  if (client_id && client_secret) {
    github.authenticate({
      type: "oauth",
      key: client_id,
      secret: client_secret
    });
  }

  var result = through2.obj(function(file, enc, callback) {
    this.push(file);
    return callback();
  });

  // collect all contributors
  getAll(github, function(err, contributors) {
    if (err) {
      result.emit("error", err);
      return;
    }

    contributors.sort(function(a, b){return a['github_id'].localeCompare(b['github_id'])});

    // write contributors to output stream
    var file = new gutil.File({
      path: "contributors-gen.js",
      contents: new Buffer(JSON.stringify(contributors, undefined, 2), "utf-8")
    });
    result.write(file);
    result.end();
  });

  return result;
};
