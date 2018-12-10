// Rules:
// - Logos should be completely white and 180px wide
// - Only companies with a wikipedia page are listed on the home page. Annual
//   revenue and number of employees will also be taken into account.
// - All users are automatically sorted alphabetically (according to the
//   lower-case filename of their logo), but for the sake of readability it
//   is advised to sort them in the list below as well.

var all_users = {
    max_home_page_users: 16, // maximum number of users on the home page
    logos: [{
            src: "AirWatch_logo.png",
            link: "http://www.air-watch.com",
            height: 84,
            wikipedia: "http://en.wikipedia.org/wiki/AirWatch",
            revenue_billion: 1.181,
            employees: 2300
        }, {
            src: "AntMedia_logo.png",
            link: "https://antmedia.io",
            height: 130,
        }, {
            src: "apislabs.png",
            link: "http://apislabs.us/",
            height: 40
        }, {
            src: "bosch-brand-white.png",
            link: "http://www.bosch-si.com",
            height: 53,
            wikipedia: "http://en.wikipedia.org/wiki/Robert_Bosch_GmbH",
            revenue_billion: 73.1,
            employees: 390000
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
            src: "datascience_logo.png",
            link: "http://datascience.com/",
            height: 33
        }, {
            src: "eprocurement.png",
            link: "http://eprocurement-indonesia.com/",
            height: 44
        }, {
            src: "education_first.png",
            link: "http://www.ef.edu",
            height: 55
        }, {
            src: "ekuaibao.png",
            link: "https://www.ekuaibao.com/",
            height: 59
        }, {
            src: "exent_logo.png",
            link: "http://www.exent.com/",
            height: 50
        }, {
            src: "fluxon_logo.png",
            link: "https://www.fluxon.fr/",
            height: 56
        }, {
            src: "fraunhofer-white.png",
            link: "http://www.igd.fraunhofer.de",
            height: 49,
            wikipedia: "http://en.wikipedia.org/wiki/Fraunhofer_Society",
            employees: 24000
        }, {
            src: "gentics.png",
            link: "http://www.gentics.com/",
            height: 50
        }, {
            src: "graviteeio.png",
            link: 'https://gravitee.io',
            height: 77
        }, {
            src: "groupon-white.png",
            link: "http://www.groupon.com",
            height: 65,
            wikipedia: "http://en.wikipedia.org/wiki/Groupon",
            revenue_billion: 3.2,
            employees: 10000
        }, {
         	src: "hopscotch_logo_white.png",
            link: "http://www.hopscotch.in",
            height: 90,
            wikipedia: "https://en.wikipedia.org/wiki/Hopscotch_(company)",
            revenue_billion: 0.06,
            employees: 400
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
            src: "ligatus_logo.png",
            link: "http://www.ligatus.com/",
            height: 55
        }, {
            src: "malmberg_logo.png",
            link: "http://www.malmberg.nl/",
            height: 60
        }, {
            src: "mammatus_white.png",
            link: "http://www.mammatustech.com/",
            height: 80
        }, {
            src: "mnety_white.png",
            link: "http://mnety.com/",
            height: 61
        }, {
            src: "noysi.png",
            link: "https://noysi.com/",
            height: 80
        }, {
            src: "odobo.png",
            link: "https://www.odobo.com/",
            height: 55
        }, {
            src: "origami.png",
            link: "http://origami3.com/",
            height: 54
        }, {
            src: "opengov_light_2017.png",
            link: "https://opengov.com/",
            height: 40
        }, {
            src: "paradigma.png",
            link: "http://www.paradigmatecnologico.com",
            height: 47
        }, {
            src: "performit.png",
            link: "http://www.performit.co.il/",
            height: 75
        }, {
            src: "phenixid.png",
            link: "http://www.phenixid.se/",
            height: 50
        }, {
            src: "Pismo.png",
            link: "http://pismo.io/",
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
            employees: 92400
        }, {
            src: "RedHat.svg.png",
            link: "http://www.redhat.com",
            height: 65,
            wikipedia: "http://en.wikipedia.org/wiki/Red_Hat",
            revenue_billion: 2.4,
            employees: 10250
        }, {
            src: "setkeeper_logo.png",
            link: "https://setkeeper.com",
            height: 31
        }, {
            src: "sketchtogether_logo.png",
            link: "https://sketchtogether.com",
            height: 71
        }, {
            src: "taringa_logo.png",
            link: "http://www.taringa.net",
            height: 30
        }, {
            src: "ticketmaster_logo.png",
            link: "http://www.ticketmaster.com/",
            height: 30,
            wikipedia: "https://en.wikipedia.org/wiki/Ticketmaster",
            revenue_billion: 8,
            employees: 6678
        }, {
            src: "touk.png",
            height: 90,
            link: "http://touk.pl/"
        }, {
            src: "usetogether.png",
            height: 80,
            link: "http://www.use-together.com/"
        }, {
            src: "vertix.png",
            link: "http://www.vertixone.com/",
            height: 50
        }, {
            src: "vstack-co-logo-white.png",
            link: "http://vstack.co/",
            height: 65
        }, {
            src: "wombat-software-logo-white.png",
            link: "http://www.wombatsoftware.de",
            height: 90
        }, {
            src: "yaykuy.png",
            link: "http://www.yaykuy.cl/",
            height: 45
        }, {
            src: "zanox.png",
            link: "http://www.zanox.com/",
            height: 48
        }, {
            src: "memgrid.png",
            link: "https://www.memgrid.com",
            height: 39
        }, {
            src: "movingimage_logo.png",
            link: "https://www.movingimage24.com",
            height: 84
        }, {
            src: "Viking-Labs-Logo-White.png",
            link: "http://vikinglabs.com.br",
            height: 39
        }, {
            src: "tesco_logo.png",
            link: "http://www.tesco.com/",
            height: 48,
            wikipedia: "https://en.wikipedia.org/wiki/Tesco",
            revenue_billion: 55.917,
            employees: 500000
        },
        {
            src: "hot_schedules_white.png",
            link: "https://hotschedules.com/",
            height: 48
        }, {
            src: "databerries-white.png",
            link: "http://databerries.com/",
            height: 40
        }, {
            src: "zalando_logo.png",
            link: "https://tech.zalando.com/",
            wikipedia: "https://en.wikipedia.org/wiki/Zalando",
            height: 50,
            employees: 10000,
            revenue_billion: 3
        }, {
            src: "machineshop.png",
            link: "http://www.machineshop.io/",
            height: 30
        }, {
            src: "swiss-post.png",
            link: "https://www.post.ch",
            height: 50,
            wikipedia: "https://en.wikipedia.org/wiki/Swiss_Post",
            revenue_billion: 8.5,
            employees: 62341
        }, {
            src: "jdriven_white.png",
            link: "http://www.jdriven.com",
            height: 46
        }, {
            src: "swisscom.png",
            link: "https://swisscom.ch",
            height: 65,
            wikipedia: "https://en.wikipedia.org/wiki/Swisscom",
            revenue_billion: 11.7,
            employees: 21637
        }, {
            src: "leapcloud-logo.png",
            link: "http://leapcloud.cn",
            height: 40
        }, {
            src: "credittone-logo.png",
            link: "http://www.credittone.com",
            height: 65
        }, {
            src: "mindera-logo.png",
            link: "http://www.mindera.com",
            height: 50
        }, {
            src: "lianshi.png",
            link: "http://www.ciphergateway.com",
            height: 150
        }, {
            src: "instana.png",
            link: "https://www.instana.com",
            height: 25
        },
        {
            src: "lastminute.png",
            link: "http://www.lastminute.com",
            height: 21,
            wikipedia: 'https://en.wikipedia.org/wiki/Lastminute.com_Group',
            employees: 1500
        },
        {
            src: "rumbo.png",
            link: "http://www.rumbo.es",
            height: 59,
            wikipedia: 'https://en.wikipedia.org/wiki/Lastminute.com_Group',
            employees: 1500
        },
        {
            src: "volagratis.png",
            link: "http://www.volagratis.com",
            height: 44,
            wikipedia: 'https://en.wikipedia.org/wiki/Lastminute.com_Group',
            employees: 1500
        },
        {
            src: "activeos_logo.png",
            link: "http://activeos.com",
            height: 65
        },
        {
            src: "1000geeks.png",
            link: "http://www.1000geeks.com",
            height: 125
        },
        {
            src: "RubiconProject_logo.png",
            link: "https://rubiconproject.com",
            height: 80
        },
        {
            src: "dbg-bw-logo.png",
            link: "http://deutsche-boerse.com/dbg-en/",
            height: 38,
            employees: 5283,
            wikipedia: "https://en.wikipedia.org/wiki/Deutsche_B%C3%B6rse",
            revenue_billion: 2.367
        },
		    {
            src: "mobitech_logo_white.png",
            link: "http://mobitech.io/",
            height: 31,
            employees: 24
        }
    ]
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
