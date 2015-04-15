$(document).ready(function() {
    // make sidebar sticky when it hits the top of the viewport
    var $sidebar = $("#sidebar");
    $sidebar.affix({
        offset: {
            top: $sidebar.offset().top - 20,
            bottom: $("footer").outerHeight(true) + 20
        }
    });

    $(window).resize(function() {
        $sidebar.affix("checkPosition");
    });

    // add .nav class to all lists in the sidebar (necessary for scrollspy)
    $("#sidebar").find("ul").addClass("nav");

    // enable scrollspy
    $("body").scrollspy({ target: "#sidebar" });
});
