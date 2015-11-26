var moment = require('moment');

var conferences = [
    {
        title: "Next-Generation-Applications",
        conference: "SpringOne 2011",
        date: "01/12/2011",
        speaker: "Tim Fox",
        link: "http://www.infoq.com/presentations/SpringOne-2GX-Keynote-Next-Generation-Applications"
    },

    {
        title: "Vert.x - Polyglot Asynchronous Application Development For The Modern Web",
        conference: "GotoConf Amsterdam 2012",
        date: "24/05/2012",
        speaker: "Tim Fox",
        link: "http://gotocon.com/dl/goto-amsterdam-2012/slides/TimFox_VertXPolyglotAsynchronousApplicationDevelopmentForTheModernWeb.pdf"
    },

    {
        title: "Asynchronous IO with Vert.x",
        conference: "GR8Conf 2012",
        date: "08/06/2012",
        speaker: "Peter Ledbrook",
        link: "http://www.slideshare.net/gr8conf/vertx-introduction"
    },

    {
        title: "Vert.x - Polyglot and Scalable Apps for the JVM",
        conference: "webtuesday",
        date: "09/10/2012",
        speaker: "Alvaro Videla",
        link: "http://www.slideshare.net/old_sound/vertx"
    },

    {
        title: "A (very) quick intro to vert.x",
        date: "26/10/2012",
        speaker: "Jason Marah",
        link: "http://prezi.com/jenln0j_yaix/intro-to-vertx/"
    },

    {
        title: "Introducing Vert.x",
        date: "01/11/2012",
        conference: "Devoxx 2012",
        speaker: "Tim Fox",
        link: "http://parleys.com/play/5148922b0364bc17fc56c8c7"
    },

    {
        title: "vert.x - Effortless asynchronous application development for the modern web and enterprise",
        date: "08/11/2012",
        conference: "W-Jax 2012",
        speaker: "Stuart Williams",
        link: "http://flex.winfxpro.info/download/?noderef=workspace://SpacesStore/6e8574c6-737b-4eb4-a954-f4147acb3668"
    },

    {
        title: "Vert.x - This ain't your Dad's node!",
        date: "21/11/2012",
        speaker: "Matt Stine",
        link: "http://www.youtube.com/watch?v=8ClYUo_A3h0"
    },

    {
        title: "vert.x - Effortless asynchronous application development for the modern web and enterprise",
        date: "14/12/2012",
        conference: "Groovy Grails Exchange 2012",
        speaker: "Stuart Williams",
        link: "http://www.slideshare.net/pidster/groovy-grails-exchange-2012-vertx-presentation"
    },

    {
        title: "Vert.x - asynchronous event-driven web-applications on the JVM",
        date: "14/12/2012",
        conference: " SBB Developer Day 2012",
        speaker: "Jonas Bondi",
        link: "http://blog.jonasbandi.net/2012/12/presentation-vertx-asynchrones-event.html"
    },
    {
        title: "vert.x - asynchronous applications + big data",
        date: "28/03/2013",
        speaker: "Stuart Williams",
        conference: "Devoxx London",
        link: "http://www.slideshare.net/pidster/vertx-devoxx-london-2013-17795234"
    },
    {
        date: "28/03/2013",
        title: "EclipseCon 2013 Vert.x keynote",
        speaker: "Tim Fox",
        link: "http://www.slideshare.net/timfox111/vertx-keynote-for-eclipsecon-2013"
    },
    {
        date: "25/04/2013",
        title: "vert.x - an introduction",
        speaker: "Clebert Suconic &amp; Samuel Tauil",
        conference: "JUDCON Brazil",
        link: "http://www.slideshare.net/samueltauil/vertx-judcon"
    },
    {
        title: "vert.x - c'est bon pour dans ton corps (french)",
        date: "13/05/2013",
        speaker: "Aurélien Maury @ BreizhCamp",
        conference: "https://speakerdeck.com/amaury/vert-dot-x-cest-bon-pour-dans-ton-corps"
    },
    {
        title: "Getting groovier-with-vertx",
        date: "24/05/2013",
        conference: "GR8C or Europa 2013",
        speaker: "Hitesh Batia",
        link: "http://www.slideshare.net/Intelligrape/getting-groovierwithvertx-vf22-may-2013"
    },
    {
        date: "12/06/2013",
        title: "Red Hat JBoss Keynote",
        speaker: "Mark Little",
        conference: "Red Hat Summit (talks about Vert.x and includes live Vert.x demo)",
        link: "http://www.youtube.com/watch?v=mjT-pMCkkTY"
    },
    {
        date: "18/06/2013",
        title: "Asynchronous Application Development on the JVM",
        speaker: "Ravi Luthra",
        conference: "Portland JUG",
        link: "http://coding2012.github.io/pjug/"
    },
    {
        date: "04/07/2013",
        title: "vert.x - polyglot - modular - asynchronous",
        speaker: "Eberhard Wolff",
        link: "http://prezi.com/bfusjp5ruxxd/vertx-polyglot-modular-asynchronous/"
    },
    {
        date: "13/10/2013",
        title: "Introducing Vert.x 2.0 - Taking Polyglot Application Development to the Next Level",
        speaker: "Tim Fox",
        conference: "JAX London",
        link: "https://www.youtube.com/watch?v=3hv4QD5ZvKE"
    },
    {
        date: "24/10/2013",
        speaker: "Bartek Zdanowski",
        link: "http://www.slideshare.net/zdanek/vertx-jdd13-english",
        title: "vert.x",
        conference: "JDD 2013"
    },
    {
        date: "30/10/2013",
        speaker: "Norman Maurer",
        conference: "Eclipsecon EU 2013",
        title: "The next-gen polyglot asynchronous platform",
        link: "http://normanmaurer.me/presentations/2013-eclipsecon-eu-vertx/"
    },
    {
        date: "13/11/2013",
        speaker: "Tim Fox",
        title: "Introducing Vert.x 2.0 - Taking Polyglot Application Development to the Next Level",
        conference: "Devoxx Be 2013",
        link: "https://www.voxxed.com/blog/presentation/introducing-vert-x-2-0-taking-polyglot-application-development-to-the-next-level/"
    },
    {
        date: "14/05/2014",
        speaker: "Tim Fox",
        title: "JAX Innovation Award 2014",
        conference: "JAX Innovation Award 2014 Acceptance speech",
        link: "https://www.youtube.com/watch?v=gICfDt28CUE"
    },
    {
        date: "15/05/2014", speaker: "Tim Fox", conference: "Geecon", title: "High Performance Reactive Applications" +
    " with Vert.x", link: "https://vimeo.com/100211161"
    },
    {
        date: "10/08/2014",
        speaker: "Tim Fox",
        conference: "QCon London",
        title: "High Performance Reactive Applications with Vert.x",
        link: "http://www.infoq.com/presentations/performance-reactive-vertx"
    },
    {
        date: "26/10/2014",
        speaker: "Tim Fox",
        conference: "JavaOne",
        title: "Writing Highly Concurrent Polyglot Applications with Vert.x",
        link: "https://www.youtube.com/watch?v=AhePaf7a6pY"
    },
    {
        date: "06/11/2014",
        speaker: "Tim Fox",
        conference: "GOTO Berlin",
        title: "Writing Highly Concurrent Polyglot Applications with Vert.x",
        link: "https://www.youtube.com/watch?v=EMtoN9wFEOU"
    },
    {
        date: "23/11/2014",
        speaker: "Tim Fox",
        title: "High Performance Reactive Applications with Vert.x",
        conference: "Philadelphia Emerging Technologies for the Enterprise Conference",
        link: "http://www.infoq.com/presentations/reactive-apps-vertx"
    },
    {
        title: "Applications concurrentes polyglottes avec vert.x (french)",
        date: "09/04/2015",
        speaker: "Julien Viet",
        conference: "Devoxx France 2015",
        link: "https://www.parleys.com/tutorial/applications-concurrentes-polyglottes-avec-vert-x"
    },
    {
        title: "Applications concurrentes polyglottes avec vert.x (french)",
        date: "17/04/2015",
        speaker: "Julien Viet",
        conference: "Mix-it ",
        link: "http://www.infoq.com/fr/presentations/applications-concurrentes-polyglottes-vertx"
    },
    {
        title: "vert.x 3 - high performence polyglot application platform",
        date: "26/06/2015",
        speaker: "Bartek Zdanowski",
        conference: "JBCN Conf ",
        link: "https://speakerdeck.com/zdanek/vert-dot-x-3-high-performance-polyglot-application-platform"
    },
    {
        title: "Hit the plumber - develop a realtime web application with vert.x 3",
        date: "10/11/2015",
        speaker: "Clement Escoffier &amp; Paulo Lopes",
        conference: "Devoxx BE 2015",
        link: "https://www.youtube.com/watch?v=vC1EdeBZl7M"
    },
    {
        title: "Be reactive on the JVM but not only in Java",
        date: "12/11/2015",
        speaker: "Clement Escoffier &amp; Paulo Lopes",
        conference: "Devoxx BE 2015",
        link: "https://www.youtube.com/watch?v=qL5BGHPXrac"
    }
];

var articles = [
    {
        title: "Interview with Tim Fox About Vert.x 3, the Original Reactive, Microservice Toolkit for the JVM",
        media: "InfoQ",
        link: "http://www.infoq.com/articles/vertx-3-tim-fox",
        author: "Rick Hightower &amp; Tim Fox",
        date: "22/06/2015"
    }
];

function sort(dateable) {
    for (var i = 0; i < dateable.length; i++) {
        var conf = dateable[i];
        conf.time = moment(conf.date, "DD/MM/YYYY").unix();
    }
    dateable.sort(sortByDateDesc);
    return dateable;
}

sortByDateDesc = function (c1, c2) {
    return c1.time < c2.time ? 1 : c1.time > c2.time ? -1 : 0;
};


module.exports = {
    conferences: sort(conferences),
    articles: sort(articles)
};