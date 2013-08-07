(ns sketchpad.constrain)

(defn abs [v]
  (if (neg? v) (- v) v))

(defprotocol Constraint
  (constrained [self env] "The names of the constrained variables")
  (changeable [self env] "The names of the variables that can change from this constraint")
  (error [self env] "The numerical error in meeting this constraint given values in env.")
  (degrees-of-freedom-removed [self] "The number of degrees of freedom removed by this constraint"))

(defrecord Same [a b]
  Constraint
  (constrained [self env] #{a b})
  (changeable [self env] #{a b})
  (degrees-of-freedom-removed [self] 1)
  (error [self env]
    (abs (- (env a) (env b)))))

(defrecord Colinear [x1 y1 x2 y2 x3 y3]
  Constraint
  (constrained [self env] #{x1 y1 x2 y2 x3 y3})
  (changeable [self env] #{x1 y1 x2 y2 x3 y3})
  (degrees-of-freedom-removed [self] 1)
  (error [self env]
    (let [[x1 y1 x2 y2 x3 y3] (map env [x1 y1 x2 y2 x3 y3])
          slope (/ (- y2 y1) (- x2 x1))
          slope (if (= slope 0) 0.01 slope)
          colinear-x3 (+ x1 (/ (- y3 y1) slope))
          colinear-y3 (+ y1 (* slope (- x3 x1)))
          off-x (abs (- x3 colinear-x3))
          off-y (abs (- y3 colinear-y3))]
      (min off-x off-y))))

(defn total-energy [constraints env]
  (apply + (map #(Math/pow (error % env) 2) constraints)))

(defn relevant-constraints [var constraints env]
  (filter #((set (constrained % env)) var) constraints))

(defn linear-approximation [constraints var env]
  (let [start-value (env var)
        cs (relevant-constraints var constraints env)
        start-energy (total-energy cs env)
        dx 0.001
        energy-inc (total-energy cs (update-in env [var] - dx))
        energy-dec (total-energy cs (update-in env [var] + dx))
        slope (/ (- energy-inc energy-dec) (* 2 dx))
        intercept (- start-energy (* slope start-value))]
    [intercept slope]))

(defn sharpest-slope
  [cs vars env]
  (let [approximations (into {} (map #(vec [% (linear-approximation cs % env)]) vars))]
    (apply max-key (comp abs second val) approximations)))

;; magic numbers are suspicious: dx, max-slope, etc.
(defn walk-downhill
  [cs vars env]
  (let [[var [_ slope]] (sharpest-slope cs vars env)]
    (if (< (abs slope) 1)
      env
      (recur cs vars (update-in env [var] (if (neg? slope) - +) 1)))))