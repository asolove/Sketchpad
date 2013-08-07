# Sketchpad

A ClojureScript recreation of Ivan Sutherland's Sketchpad, the first graphical user interface program, and still one of the best. 

## References

* [Sketchpad: A man-machine graphical communication system](http://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-574.pdf): a digitized version of Sutherland's thesis.
* [Alan Kay discussing Sketchpad and showing its use](http://www.youtube.com/watch?v=mOZqRJzE8xg)

## Status

* DONE: Basic drawing of points, circles, and lines, rendered to <canvas>
* TODO: add arcs, erasure, numbers, other drawable items
* TODO: update the UI to have real affordances
* TODO: masters and instances
* IN PROGRESS: constraints
  * DONE: reproduce the basic interface of Sketchpad's energy-relaxation solver.
  * TODO: debug possible infinite loops, perf problems in naive relaxation solver. Make constraint solver async, yielding control so events can be handled.
  * TODO: add constraint types: midpoint, perpendicular, same length
  * TODO: add a UI for adding and viewing constraints
  * ?: reproduce the faster solver method that identifies a DAG of constraint dependencies

## License

Copyright © 2013 Adam Solove

Distributed under the Eclipse Public License, the same as Clojure.
