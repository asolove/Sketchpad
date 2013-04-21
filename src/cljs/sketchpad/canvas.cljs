(ns sketchpad.canvas)

(defn drawLine [context {:keys [x1 y1 x2 y2 w]}]
  (.beginPath context)
  (set! (.-lineWidth context) (or w 1))
  (set! (.-strokeStyle context) "#999")
  (.moveTo context x1 y1)
  (.lineTo context x2 y2)
  (.stroke context))

(defn drawCircle [context {:keys [x y r]}]
  (.beginPath context)
  (.arc context x y r 0 (* 2 Math/PI) false)
  (set! (.-fillStyle context) "green")
  (.fill context)
  (set! (.-lineWidth context) 1)
  (set! (.-strokeStyle context) "black")
  (.stroke context))