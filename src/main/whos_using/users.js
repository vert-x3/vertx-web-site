// Rules:
// - Logos should be completely white and 180px wide
// - Only companies with a wikipedia page are listed on the home page. Annual
//   revenue and number of employees will also be taken into account.
// - All users are automatically sorted alphabetically (according to the
//   lower-case filename of their logo), but for the sake of readability it
//   is advised to sort them in the list below as well.

var all_users = {
  max_home_page_users: 12, // maximum number of users on the home page
  logos: [{
    src: "AirWatch_logo.png",
    link: "http://www.air-watch.com",
    height: 84,
    wikipedia: "http://en.wikipedia.org/wiki/AirWatch"
  }, {
    src: "apislabs.png",
    link: "http://apislabs.us/",
    height: 40
  }, {
    src: "bosch-brand-white.png",
    link: "http://www.bosch-si.com",
    height: 53,
    wikipedia: "http://en.wikipedia.org/wiki/Robert_Bosch_GmbH",
    revenue_billion: 48.9,
    employees: 290000
  }, {
    src: "boundary.png",
    link: "http://www.boundary.com/",
    height: 56
  }, {
    src: "campudus_white.png",
    link: "http://campudus.com/",
    height: 37
  }, {
    src: "clear_software.png",
    link: "http://www.clearsoftware.ca/",
    height: 72
  }, {
    src: "cyanogen_logo_white.png",
    link: "https://cyngn.com/",
    height: 50,
    wikipedia: "http://en.wikipedia.org/wiki/CyanogenMod"
  }, {
    src: "exent_logo.png",
    link: "http://www.exent.com/",
    height: 50
  }, {
    src: "fraunhofer-white.png",
    link: "http://www.igd.fraunhofer.de",
    height: 49,
    wikipedia: "http://en.wikipedia.org/wiki/Fraunhofer_Society",
    revenue_billion: 1.7,
    employees: 23000
  }, {
    src: "gentics.png",
    link: "http://www.gentics.com/",
    height: 50,
  }, {
    src: "groupon-white.png",
    link: "http://www.groupon.com",
    height: 65,
    wikipedia: "http://en.wikipedia.org/wiki/Groupon",
    revenue_billion: 3.2,
    employees: 10000
  }, {
    src: "hulu_logo_transparent_small.png",
    link: "http://www.hulu.com/",
    height: 55,
    wikipedia: "http://en.wikipedia.org/wiki/Hulu",
    revenue_billion: 1
  }, {
    src: "infiverve.png",
    link: "http://www.infiverve.com/",
    height: 42
  }, {
    src: "jClarity_logo.png",
    link: "http://www.jclarity.com",
    height: 42
  }, {
    src: "jpoint_logo.png",
    link: "http://www.jpoint.nl/",
    height: 70
  }, {
    src: "liferay_white.png",
    link: "http://www.liferay.com/",
    height: 45,
    wikipedia: "http://en.wikipedia.org/wiki/Liferay"
  }, {
    src: "malmberg_logo.png",
    link: "http://www.malmberg.nl/",
    height: 60
  }, {
    src: "mammatus_white.png",
    link: "http://www.mammatustech.com/",
    height: 80
  }, {
    src: "odobo.png",
    link: "https://www.odobo.com/",
    height: 55
  }, {
    src: "performit.png",
    link: "http://www.performit.co.il/",
    height: 75
  }, {
    src: "phenixid.png",
    link: "http://www.phenixid.se/",
    height: 50
  }, {
    src: "plasmatherm.png",
    link: "http://www.plasmatherm.com/",
    height: 25
  }, {
    src: "rbs.png",
    link: "http://www.rbs.com",
    height: 55,
    wikipedia: "http://en.wikipedia.org/wiki/The_Royal_Bank_of_Scotland",
    employees: 141000
  }, {
    src: "RedHat.svg.png",
    link: "http://www.redhat.com",
    height: 65,
    wikipedia: "http://en.wikipedia.org/wiki/Red_Hat",
    revenue_billion: 1.5,
    employees: 7300
  }, {
    src: "taringa_logo.png",
    link: "http://www.taringa.net",
    height: 30
  }, {
    src: "vstack-co-logo-white.png",
    link: "http://vstack.co/",
    height: 65
  }, {
    src: "wombat-software-logo-white.png",
    link: "http://www.wombatsoftware.de",
    height: 119
  }, {
    src: "yaykuy.png",
    link: "http://www.yaykuy.cl/",
    height: 45
  }, {
    src: "zanox.png",
    link: "http://www.zanox.com/",
    height: 48
  }]
};

function sort_by_logo_name(a, b) {
  var la = a.src.toLowerCase();
  var lb = b.src.toLowerCase();
  if (la > lb) {
    return 1;
  }
  if (la < lb) {
    return -1;
  }
  return 0;
}

function sort_by_relevance(a, b) {
  // very simple but effective algorithm. may be improved eventually if we
  // feel it doesn't reflect reality.
  if (a.revenue_billion && !b.revenue_billion) {
    return -1;
  }
  if (b.revenue_billion && !a.revenue_billion) {
    return 1;
  }
  if (a.employees && !b.employees) {
    return -1;
  }
  if (b.employees && !a.employees) {
    return 1;
  }
  if (a.revenue_billion && b.revenue_billion) {
    if (a.revenue_billion > b.revenue_billion) {
      return -1;
    }
    if (a.revenue_billion < b.revenue_billion) {
      return 1;
    }
  }
  if (a.employees && b.employees) {
    if (a.employees > b.employees) {
      return -1;
    }
    if (a.employees < b.employees) {
      return 1;
    }
  }
  return sort_by_logo_name(a, b);
}

function make_users_home_page() {
  var result = all_users.logos.filter(function(u) {
    return !!u.wikipedia;
  });
  result = result.sort(sort_by_relevance);
  result = result.slice(0, all_users.max_home_page_users);
  result = result.sort(sort_by_logo_name);
  return result;
}

module.exports = {
  users_home_page: make_users_home_page(),
  users_all: all_users.logos.sort(sort_by_logo_name)
};
