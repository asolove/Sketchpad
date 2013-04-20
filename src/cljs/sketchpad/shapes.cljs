(ns sketchpad.shapes
  (:use [sketchpad.canvas :only [drawLine drawCircle]]))

(defn distance [a b]
  (->> (map - a b) (map #(Math.pow % 2)) (reduce +) Math.sqrt))

(defprotocol Selectable
  "Objects that can receive focus"
  (cursor-distance [item x y universe]))

(defprotocol Drawable
  "Objects that can be drawn on the sketchpad canvas"
  (draw [item ctx universe] "Draw the object on the context given the universe"))

(defrecord Point [x y]
  Drawable
  (draw [point ctx universe]
    (drawCircle ctx {:x x :y y
                     :r (if (= point (get universe (:selected universe)))
                          6
                          (if (= point (get universe (:highlighted universe)))
                            4
                            2))}))
  
  Selectable
  (cursor-distance [point cx cy universe] (distance [x y] [cx cy])))

(defrecord Line [p1 p2]
  Drawable
  (draw [line ctx universe]
    (let [{x1 :x y1 :y} (universe p1)
          {x2 :x y2 :y} (universe p2)]
      (drawLine ctx {:x1 x1 :x2 x2 :y1 y1 :y2 y2})))
  
  Selectable
  (cursor-distance [line cx cy universe] 1000))