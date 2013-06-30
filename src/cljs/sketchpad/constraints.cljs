(ns sketchpad.constraints)

; - given a drawing including constraints
; - pick a variable that has constraints
;   - linearize all constraints on that variable at current values
;   - find minimum for that value with all others locked
;   - update drawing state
;   - pick another var and repeat

(defprotocol Constraint
  (error [this drawing])
  (constrains [this])
  (degrees-of-freedom-removed [this]))

(defrecord Equal [n1 n2]
  Constraint
  (error [this drawing]
    (Math.abs (- (drawing n1) (drawing n2))))
  (constrains [this] [n1 n2])
  (degrees-of-freedom-removed [this] 1))

(defn constraints [drawing]
  (vals
   (filter (comp (partial satisfies? Constraint) val)
           drawing)))

(defn total-error [drawing]
  (apply + (map #(error % drawing) (constraints drawing))))

(defn solve-constraints [drawing]
  (let [cs (constraints drawing)
        vs (distinct (flatten (map constrains cs)))]

    ))
