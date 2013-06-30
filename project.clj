(defproject sketchpad "0.1.0-SNAPSHOT"
  :description "A Sketchpad clone for the web"
  :url "http://github.com/asolove/sketchpad"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/clojurescript "0.0-1835"]
                 [com.keminglabs/cassowary "0.1.0"]
                 [com.cemerick/piggieback "0.0.5"]]

  :source-paths ["src/clj"]

  :plugins [[lein-cljsbuild "0.3.0"]]

  :repl-options {:nrepl-middleware [cemerick.piggieback/wrap-cljs-repl]}

  :cljsbuild {
              :builds [{
                        :source-paths ["src/cljs"]
                        :compiler {
                                   :output-to "resources/public/sketchpad.js"
                                   :output-dir "resources/tmp/"
                                   :optimizations :whitespace
                                   :pretty-print true
                                   :libs ["cassowaryjs"]} }] })
