(ns sketchpad.core
  (:use [sketchpad.shapes :only [draw cursor-distance Selectable Drawable Point Line Circle move!]]
                                        ; [webfui.state-patches :only [patch]]))
        [sketchpad.state-patches :only [patch]]))

(def current-universe (atom {}))
(def start-x (atom nil))
(def start-y (atom nil))

(defn drawables [universe]
  (filter (fn [[name item]] (satisfies? Drawable item)) universe))

(defn selectables [universe]
  ; TODO: also disallow item attached to currently-selected item?
  (filter (fn [[name item]]
            (and
             (not (= name (universe :selected)))
             (satisfies? Selectable item))) universe))

(defn draw-universe [universe ctx]
  (.clearRect ctx 0 0 800 600)
  (doseq [[name item] (drawables universe)]
    (draw item ctx universe)))

(defn closest [u cx cy]
  (let [selectable (selectables u)
        distances (map (fn [[name item]] [name (cursor-distance item cx cy u)]) selectable)
        [item distance] (apply min-key second distances)]
    (when (< distance 10) item)))

(defn event-location [e]
  [(.-layerX e) (.-layerY e)])

(defn highlight-closest [e]
  (let [u @current-universe
        [cx cy] (event-location e)
        item (closest u cx cy)]
    (swap! current-universe assoc :highlighted item)))

(defn move-selected [e]
  (let [u @current-universe
        selected (:selected u)]
    (when selected
      (let [[x1 y1] [@start-x @start-y]
            [x2 y2] (event-location e)
            dx (- x2 x1)
            dy (- y1 y1)
            item (selected u)
            new-u (patch u (move! item selected dx dy u))]
        (swap! start-x (constantly x2))
        (swap! start-y (constantly y2))
        (swap! current-universe #(patch % (move! (selected u) selected (- x2 x1) (- y2 y1) %)))))))

(defn select-closest [e]
  (let [[x y] (event-location e)]
    (swap! start-x (constantly x))
    (swap! start-y (constantly y)))
  (swap! current-universe (fn [u] (assoc u :selected (:highlighted u)))))

(defn deselect-selected [e]
  (let [u @current-universe
        selected (u :selected)
        highlighted (u :highlighted)
        both-points (and (instance? Point (u selected)) (instance? Point (u highlighted)))]
    (when both-points
      (js/console.log "merging" selected "and" highlighted)
                                        ; nested updates to state suck
      (swap! current-universe assoc :highlighted nil)
      (swap! current-universe dissoc highlighted)
      (doseq [[name item] u
              [key val] item]
        (when (= val highlighted)
          (js/console.log "setting" name key "from" (get-in @current-universe [name key]) "to" selected)
          (swap! current-universe assoc-in [name key] selected)
          (when (< 1 (count (filter (fn [[key val]] (= val selected)) item)))
            (swap! current-universe dissoc name))
          (js/console.log (get-in @current-universe [name key]))))))

  (swap! current-universe assoc :selected nil)
  (js/console.log @current-universe))
  

(defn ^:export main []
  (let [canvas (js/document.getElementById "canvas")
        ctx (.getContext canvas "2d")]
    (swap! current-universe conj
           {
            :p1 (Point. 50 20)
            :p2 (Point. 300 300)
            :p3 (Point. 210 210)
            :p4 (Point. 340 210)
            :p5 (Point. 210 340)
            :l1 (Line. :p1 :p2)
            :l2 (Line. :p2 :p3)
            :l3 (Line. :p1 :p4)
            :l4 (Line. :p1 :p5)
            :l5 (Line. :p3 :p5)
            :c1 (Circle. :p3 :p4 :p5)
           })

    (js/setInterval #(draw-universe @current-universe ctx) 16)
    (.addEventListener canvas "mousemove" highlight-closest)
    (.addEventListener canvas "mousemove" move-selected)
    (.addEventListener canvas "mousedown" select-closest)
    (.addEventListener canvas "mouseup" deselect-selected)))
