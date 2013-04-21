(ns sketchpad.state-patches
  (:use [clojure.set :only [union]]))

                                        ; basic idea from webfui.state-patches.
; changed here to only work one level deep, but works with records

(defn patch [state diff]
  (if diff
    (into {} (for [key (union (set (keys state)) (set (keys diff)))]
               [key (let [val1 (key state)
                          val2 (key diff)]
                      (if (and val1 val2)
                        (merge val1 val2)
                        (or val2 val1)))]))
    state))
