(ns sketchpad.core
  (:use [sketchpad.shapes :only [draw cursor-distance Selectable Drawable Point Line]]))

(def current-universe (atom {}))

(defn inspect-universe [universe]
  (comment (js/console.log universe)))

(defn drawables [universe]
  (filter (fn [[name item]] (satisfies? Drawable item)) universe))

(defn selectables [universe]
  (filter (fn [[name item]] (satisfies? Selectable item)) universe))

(defn draw-universe [universe ctx]
  (inspect-universe universe)
  (.clearRect ctx 0 0 600 1000)
  (doseq [[name item] (drawables universe)]
    (draw item ctx universe)))

(defn closest [u cx cy]
  (let [selectable (selectables u)
        distances (into {} (map (fn [[name item]] [name (cursor-distance item cx cy u)]) selectable))
        [[distance closest]] (into (sorted-map) (zipmap (vals distances) (keys distances)))]
    closest))
                                

(defn highlight-closest [e]
  (let [u @current-universe
        not-selected (filter (fn [[name item]] (not (= name (:selected u)))) u)
        cx (.-layerX e)
        cy (.-layerY e)
        closest (closest u cx cy)]
    (swap! current-universe assoc :highlighted closest)))

(defn move-selected [e]
  (let [u @current-universe
        selected (:selected u)]
    (when selected
      (let [cx (.-layerX e)
            cy (.-layerY e)]
        (swap! current-universe update-in [selected] #(merge % {:x cx :y cy}))))))

(defn select-closest [e]
  (swap! current-universe (fn [u] (assoc u :selected (:highlighted u)))))

(defn deselect-selected [e]
  (swap! current-universe assoc :selected nil))
  

(defn ^:export main []
  (let [canvas (js/document.getElementById "canvas")
        ctx (.getContext canvas "2d")]
    (swap! current-universe conj
           {
            :p1 (Point. 50 20)
            :p2 (Point. 30 30)
            :p3 (Point. 90 20)
            :p4 (Point. 100 10)
            :p5 (Point. 10 100)
            :l1 (Line. :p1 :p2)
            :l2 (Line. :p2 :p3)
            :l3 (Line. :p1 :p4)
            :l4 (Line. :p1 :p5)
            :l5 (Line. :p3 :p5)
           })

    (js/setInterval #(draw-universe @current-universe ctx) 16)
    (.addEventListener canvas "mousemove" highlight-closest)
    (.addEventListener canvas "mousemove" move-selected)
    (.addEventListener canvas "mousedown" select-closest)
    (.addEventListener canvas "mouseup" deselect-selected)))
