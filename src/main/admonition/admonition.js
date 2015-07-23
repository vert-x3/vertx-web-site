
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

var TEMPLATE_WITH_TITLE = "<div class='admonition-block {0}'>"
    + "<table><tbody><tr>"
    + "<td class='admonition-icon'><i class='admonition-icon fa {1}'></i></td>"
    + "<td class='content'><span class='title'>{2}</span><br/><span class='content'>{3}</span></td>"
    + "</tr></tbody></table></div>";

var TEMPLATE_WITHOUT_TITLE = "<div class='admonition-block {0}'>"
    + "<table><tbody><tr>"
    + "<td class='admonition-icon'><i class='admonition-icon fa {1}'></i></td>"
    + "<td class='content'><span class='content'>{2}</span></td>"
    + "</tr></tbody></table></div>";


function generate(description) {
    if (description.title) {
        return TEMPLATE_WITH_TITLE.format(description.type, description.icon, description.title, description.content);
    } else {
        return TEMPLATE_WITHOUT_TITLE.format(description.type, description.icon, description.content);
    }
}

function notes(content) {
    return content.replace(/\[NOTE ([^\]]*)]/g, function(match, extracted) {
        var array = extracted.split("|", 2);
        var description = {
            type : "note",
            icon : "fa-comment"
        };
        if (array.length == 1) {
            description.content = array[0];
        } else {
            description.title = array[0];
            description.content = array[1];
        }

        return generate(description);
    });
}

function warnings(content) {
    return content.replace(/\[WARNING ([^\]]*)]/g, function(match, extracted) {
        var array = extracted.split("|", 2);
        var description = {
            type : "warning",
            icon : "fa-warning"
        };
        if (array.length == 1) {
            description.content = array[0];
        } else {
            description.title = array[0];
            description.content = array[1];
        }

        return generate(description);
    });
}

function info(content) {
    return content.replace(/\[INFO ([^\]]*)]/g, function(match, extracted) {
        var array = extracted.split("|", 2);
        var description = {
            type : "info",
            icon : "fa-info-circle"
        };
        if (array.length == 1) {
            description.content = array[0];
        } else {
            description.title = array[0];
            description.content = array[1];
        }

        return generate(description);
    });
}

function important(content) {
    return content.replace(/\[IMPORTANT ([^\]]*)]/g, function(match, extracted) {
        var array = extracted.split("|", 2);
        var description = {
            type : "important",
            icon : "fa-exclamation-circle"
        };
        if (array.length == 1) {
            description.content = array[0];
        } else {
            description.title = array[0];
            description.content = array[1];
        }

        return generate(description);
    });
}

function all(content) {
    return important(notes(warnings(info(content))));
}

module.exports = {
    all : all,
    notes : notes,
    warning : warnings
};