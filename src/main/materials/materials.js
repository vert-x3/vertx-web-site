var moment = require('moment');

var books = [
  {
    title: "Building Reactive Microservices in Java",
    author: "Clément Escoffier",
    link: "https://developers.redhat.com/promotions/building-reactive-microservices-in-java/",
    date: "03/05/2017"
  },
  {
    title: "A gentle guide to asynchronous programming with Eclipse Vert.x for Java developers",
    author: "Julien Ponge, Thomas Segismont and Julien Viet",
    link: "/docs/guide-for-java-devs",
    date: "19/10/2017"
  }
];

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
  },
  {
    title: "Vert.x: руководство по эксплуатации (russian)",
    date: "17/10/2015",
    speaker: "Vladimir Krasilschik",
    conference: "Joker 2015",
    link: "https://www.youtube.com/watch?v=JRFwicUlwyI&list=PLVe-2wcL84b8x3krxqsYHwlmfb4kb8A4n&index=14"
  },
  {
    title: "Vert.x 3: What's new?",
    date: "05/11/2015",
    speaker: "Erwin de Gier",
    conference: "JFall 2015",
    link: "https://www.youtube.com/watch?v=blGAtipoh-U&feature=youtu.be"
  },
  {
    title: "How do we use Vert.x at Melusyn?",
    date: "02/12/2015",
    speaker: "Hugo Cordier &amp; Michel Guillet",
    conference: "Paris Vert.x User Group",
    link: "https://speakerdeck.com/melusyn/how-do-we-use-vert-dot-x-at-melusyn"
  },
  {
    title: "Vert.x pour l'IoT dans l'embarqué",
    date: "21/04/2016",
    speaker: "Laurent Huet",
    conference: "Devoxx France 2016",
    link: "https://github.com/lhuet/vertxOnRpiAndOdroid"
  },
  {
    title: "Building microservices with Vert.x",
    date: "10/06/2016",
    speaker: "Bert Jan Schrijver",
    conference: "Devoxx UK",
    link: "https://www.youtube.com/watch?v=yLg-LPSRjho"
  },
  {
    title: "Let’s build a scalable async Vert.x app in < 60 min ",
    conference: "JavaZone 2016",
    date: "07/09/2016",
    speaker: "Paulo Lopes",
    link: "https://vimeo.com/album/4133413/video/181905280"
  },
  {
    title: "Modern app programming with RxJava and Vert.x",
    conference: "Reactsphere 2017",
    date: "02/03/2017",
    speaker: "Thomas Segismont",
    link: "https://youtu.be/XMJYNhuSKbY"
  },
  {
    title: "Reactive Internet of Things : the Vert.x way (italian)",
    conference: "Meet{cast} meetup Rome",
    date: "16/03/2017",
    speaker: "Paolo Patierno",
    link: "https://channel9.msdn.com/Series/Meetcast/Reactive-Internet-of-Things--the-Vertx-way"
  },
  {
    title: "Applications Réactives avec Eclipse Vert.x",
    conference: "Devoxx France 2017",
    date: "05/04/2017",
    speaker: "Julien Ponge &amp; Julien Viet",
    link: "https://speakerdeck.com/jponge/applications-reactives-avec-eclipse-vert-dot-x"
  },
  {
    title: "Vert.x + Kotlin - fuga dal callback-hell (italian)",
    conference: "JUG Milano",
    date: "04/05/2017",
    speaker: "Francesco Vasco",
    link: "https://www.youtube.com/watch?v=coQucUwJMJU"
  },
  {
    title: "Vert.x - Kotlin User Group Lyon",
    conference: "Kotlin User Group",
    date: "09/11/2017",
    speaker: "Julien Ponge",
    link: "https://www.meetup.com/Lyon-Kotlin-User-Group/"
  },
  {
    title: "Vert.x - Eclipse Day Lyon",
    conference: "Eclipse Day Lyon",
    date: "28/11/2017",
    speaker: "Julien Ponge",
    link: "http://www.digital-league.org/evenement/eclipse-day-lyon/"
  }
];

var articles = [
  {
    title: "Interview with Tim Fox About Vert.x 3, the Original Reactive, Microservice Toolkit for the JVM",
    media: "InfoQ",
    link: "http://www.infoq.com/articles/vertx-3-tim-fox",
    author: "Rick Hightower &amp; Tim Fox",
    date: "22/06/2015"
  },
  {
    title: "Vert.x 3.3.0 Features Enhanced Networking Microservices, Testing and More",
    media: "InfoQ",
    link: "https://www.infoq.com/news/2016/06/Vert.x-3.3.0-release-features",
    author: "Clement Escoffier",
    date: "30/06/2016"
  },
  {
    title: "Vertx.io 3.3.0 Service Discovery: Getting Started",
    media: "DZone",
    link: "https://dzone.com/articles/vertx-330-development-automation",
    author: "Ugur ARPACI",
    date: "02/07/2016"
  },
  {
    title: "Launching Vert.x Dynamically",
    media: "DZone",
    link: "https://dzone.com/articles/vertx-launcher",
    author: "Sercan Karaoglu",
    date: "29/06/2016"
  },
  {
    title: "Reactive Microservices and Service Discovery with Vert.x",
    media: "DZone",
    link: "https://dzone.com/articles/reactive-microservices-and-service-discovery-with",
    author: "Sercan Karaoglu",
    date: "26/07/2016"
  },
  {
    title: "Location Transparency With Vert.x",
    media: "DZone",
    link: "https://dzone.com/articles/location-transparency-with-vertx",
    author: "Sercan Karaoglu",
    date: "06/09/2016"
  },
  {
    title: "Secure Your Vertx 3 App With Pac4j",
    media: "DZone",
    link: "https://dzone.com/articles/secure-your-vertx",
    author: "Jérôme Leleu",
    date: "18/01/2016"
  },
  {
    title: "First Steps With Vert.x and Infinispan - Part 1: REST API",
    media: "DZone",
    link: "https://dzone.com/articles/first-steps-with-vertx-and-infinispan-rest-api",
    author: "Katia Aresti",
    date: "17/12/2017"
  },
  {
    title: "First Steps With Vert.x and Infinispan - Part 2: PUSH API",
    media: "DZone",
    link: "https://dzone.com/articles/first-steps-with-vertx-and-infinispan-push-api-par",
    author: "Katia Aresti",
    date: "18/12/2017"
  }
];

var tutorials = [
  {
    title: "Vert.x - From zero to (micro-) hero",
    link: "http://escoffier.me/vertx-hol",
    author: "Clement Escoffier",
    date: "09/09/2016"
  },
  {
    title: "Introduction to Vert.x",
    link: "http://vertx.io/blog/posts/introduction-to-vertx.html",
    author: "Clement Escoffier",
    date: "30/11/2015"
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
  books: sort(books),
  conferences: sort(conferences),
  articles: sort(articles),
  tutorials: sort(tutorials)
};
