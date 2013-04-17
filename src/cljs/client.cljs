(ns sketchpad.core)

(declare drawCircle drawLine)

(def universe (atom {}))

(defprotocol Drawable
	"Objects that can be drawn on the sketchpad canvas"
	(draw [item ctx] "Draw the object on the provided context"))

(defrecord Point [x y]
	Drawable
	(draw [point ctx] (drawCircle ctx {:x x :y y :r 2})))

(defrecord Line [p1 p2]
	Drawable
	(draw [line ctx]
		(let [{x1 :x y1 :y} (@universe p1)
			  {x2 :x y2 :y} (@universe p2)]
			(drawLine ctx {:x1 x1 :x2 x2 :y1 y1 :y2 y2}))))

(defn drawLine [context {x1 :x1 y1 :y1 x2 :x2 y2 :y2}]
	(.beginPath context)
	(set! (.-lineWidth context) 2)
	(set! (.-strokeStyle context) "#999")
	(.moveTo context x1 y1)
	(.lineTo context x2 y2)
	(.stroke context))

(defn drawCircle [context {x :x y :y r :r}]
	(.beginPath context)
	(.arc context x y r 0 (* 2 Math/PI) false)
	(set! (.-fillStyle context) "green")
	(.fill context)
	(set! (.-lineWidth context) 1)
	(set! (.-strokeStyle context) "black")
	(.stroke context))

(defn ^:export main []
	(let [canvas (js/document.getElementById "canvas")
		  context (.getContext canvas "2d")
		  p1 (Point. 10 20)
		  p2 (Point. 30 30)
		  l1 (Line. :p1 :p2)]
	   (swap! universe conj {:p1 p1 :p2 p2 :l1 l1})
	   (draw p1 context)
	   (draw p2 context)
	   (draw l1 context)))
