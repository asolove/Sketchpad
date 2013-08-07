(defproject sketchpad "0.1.0-SNAPSHOT"
  :description "A Sketchpad clone for the web"
  :url "http://github.com/asolove/sketchpad"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [org.clojure/clojurescript "0.0-1847"]]

  :source-paths ["src/clj"]

  :plugins [[lein-cljsbuild "0.3.2"]]
  
  :profiles {:dev {:plugins [[com.cemerick/austin "0.1.0"]]}}

  :cljsbuild {
              :builds [{
                        :source-paths ["src/cljs"]
                        :compiler {
                                   :output-to "resources/public/sketchpad.js"
                                   :optimizations :whitespace
                                   :pretty-print true
                                   :libs ["cassowaryjs"]} }] })
