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

(defprotocol Moveable
  "Objects that can be moved by direct interaction"
  (move! [item name dx dy universe] "Returns a state patch for the universe with item moved"))

(defrecord Point [x y]
  Drawable
  (draw [point ctx universe]
    (drawCircle ctx {:stroke "#888" :fill "#999"
                     :x (universe x) :y (universe y)
                     :r (if (= point (get universe (:selected universe)))
                          6
                          (if (= point (get universe (:highlighted universe)))
                            4
                            2))}))
  
  Selectable
  (cursor-distance [point cx cy universe] (distance [(universe x) (universe y)] [cx cy]))

  Moveable
  (move! [point name dx dy universe]
    {x (+ dx (universe x))
     y (+ dy (universe y))}))

(defrecord Line [p1 p2]
  Drawable
  (draw [line ctx universe]
    (let [{x1 :x y1 :y} (universe p1)
          {x2 :x y2 :y} (universe p2)
          width (if (= line (get universe (:highlighted universe))) 2 1)]
      (drawLine ctx {:x1 (universe x1) :x2 (universe x2) :y1 (universe y1) :y2 (universe y2) :w width})))
  
  Selectable
  (cursor-distance [line cx cy universe]
    (let [{x1 :x y1 :y} (universe p1)
          {x2 :x y2 :y} (universe p2)
          x1 (universe x1)
          y1 (universe y1)
          x2 (universe x2)
          y2 (universe y2)
          a (- y1 y2)
          b (- x2 x1)
          c (- (* x1 y2)
               (* x2 y1))
          d (/ (Math.abs (+ (* a cx) (* b cy) c)) (Math.sqrt (+ (Math.pow a 2) (Math.pow b 2))))]
      (+ d 5)))

  Moveable
  (move! [line name dx dy universe]
    (merge (move! (p1 universe) p1 dx dy universe)
           (move! (p2 universe) p2 dx dy universe))))

(defrecord Circle [center start end]
  Drawable
  (draw [circle ctx universe]
    (let [{cx :x cy :y} (universe center)
          {sx :x sy :y} (universe start)
          [cx cy sx sy] (map universe [cx cy sx sy])
          r (distance [cx cy] [sx sy])
          selected (= circle (universe (universe :highlighted)))]
      (drawCircle ctx {:fill "transparent" :stroke "#999"
                       :strokeWidth (if selected 3 1)
                       :x cx :y cy :r r})))
  Selectable
  (cursor-distance [circle x y universe]
    (let [{cx :x cy :y} (universe center)
          {sx :x sy :y} (universe start)
          [cx cy sx sy] (map universe [cx cy sx sy])
          r (distance [cx cy] [sx sy])
          d (distance [cx cy] [x y])]
      (+ 5 (Math.abs (- d r)))))

  Moveable
  (move! [circle name dx dy universe]
    (into {} (map (fn [name]
                    (let [{x :x y :y} (universe name)]
                      {x (+ dx (universe x))
                       y (+ dy (universe y))}))
                  [center start end]))))