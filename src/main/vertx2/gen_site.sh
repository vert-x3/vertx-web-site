#!/bin/sh

./gen_section.sh vertx1x_docs/docs_md/manual.md vertx1x_docs/manual_templ.html vertx1x_docs/manual.html
./gen_section.sh vertx1x_docs/docs_md/mods_manual.md vertx1x_docs/mods_manual_templ.html vertx1x_docs/mods_manual.html
./gen_section.sh vertx1x_docs/docs_md/core_manual_js.md vertx1x_docs/core_manual_js_templ.html vertx1x_docs/core_manual_js.html
./gen_section.sh vertx1x_docs/docs_md/core_manual_ruby.md vertx1x_docs/core_manual_ruby_templ.html vertx1x_docs/core_manual_ruby.html
./gen_section.sh vertx1x_docs/docs_md/core_manual_python.md vertx1x_docs/core_manual_python_templ.html vertx1x_docs/core_manual_python.html
./gen_section.sh vertx1x_docs/docs_md/core_manual_java.md vertx1x_docs/core_manual_java_templ.html vertx1x_docs/core_manual_java.html
./gen_section.sh vertx1x_docs/docs_md/core_manual_groovy.md vertx1x_docs/core_manual_groovy_templ.html vertx1x_docs/core_manual_groovy.html
./gen_section.sh vertx1x_docs/docs_md/install.md vertx1x_docs/install_manual_templ.html vertx1x_docs/install.html
./gen_section.sh vertx1x_docs/docs_md/js_web_tutorial.md vertx1x_docs/js_web_tutorial_templ.html vertx1x_docs/js_web_tutorial.html
./gen_section.sh vertx1x_docs/docs_md/ruby_web_tutorial.md vertx1x_docs/ruby_web_tutorial_templ.html vertx1x_docs/ruby_web_tutorial.html
./gen_section.sh vertx1x_docs/docs_md/python_web_tutorial.md vertx1x_docs/python_web_tutorial_templ.html vertx1x_docs/python_web_tutorial.html
./gen_section.sh vertx1x_docs/docs_md/groovy_web_tutorial.md vertx1x_docs/groovy_web_tutorial_templ.html vertx1x_docs/groovy_web_tutorial.html


./gen_section.sh docs_md/manual.md manual_templ.html manual.html
./gen_section.sh docs_md/mods_manual.md mods_manual_templ.html mods_manual.html
./gen_section.sh docs_md/core_manual_js.md core_manual_js_templ.html core_manual_js.html
./gen_section.sh docs_md/core_manual_ruby.md core_manual_ruby_templ.html core_manual_ruby.html
./gen_section.sh docs_md/core_manual_python.md core_manual_python_templ.html core_manual_python.html
./gen_section.sh docs_md/core_manual_java.md core_manual_java_templ.html core_manual_java.html
./gen_section.sh docs_md/core_manual_groovy.md core_manual_groovy_templ.html core_manual_groovy.html
./gen_section.sh docs_md/core_manual_clojure.md core_manual_clojure_templ.html core_manual_clojure.html
./gen_section.sh docs_md/core_manual_scala.md core_manual_scala_templ.html core_manual_scala.html
./gen_section.sh docs_md/core_manual_ceylon.md core_manual_ceylon_templ.html core_manual_ceylon.html
./gen_section.sh docs_md/install.md install_manual_templ.html install.html
./gen_section.sh docs_md/dev_guide.md dev_guide_templ.html dev_guide.html
./gen_section.sh docs_md/gradle_dev.md gradle_dev_templ.html gradle_dev.html
./gen_section.sh docs_md/maven_dev.md maven_dev_templ.html maven_dev.html
./gen_section.sh docs_md/embedding_manual.md embedding_manual_templ.html embedding_manual.html
./gen_section.sh docs_md/language_support.md language_support_templ.html language_support.html

sed '/<!-- PAGE HEADER -->/ {
r page_header.html
d
}' index_templ.html  | cat > index.html

sed '/<!-- PAGE HEADER -->/ {
r page_header.html
d
}' community_templ.html  | cat > community.html

sed '/<!-- PAGE HEADER -->/ {
r page_header.html
d
}' downloads_templ.html  | cat > downloads.html

sed '/<!-- PAGE HEADER -->/ {
r page_header.html
d
}' examples_templ.html  | cat > examples.html

sed '/<!-- PAGE HEADER -->/ {
r page_header.html
d
}' docs_templ.html  | cat > docs.html



