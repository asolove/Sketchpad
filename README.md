# Sketchpad

A ClojureScript recreation of Ivan Sutherland's Sketchpad, the first graphical user interface program, and still one of the best. 

## References

* [Sketchpad: A man-machine graphical communication system](http://www.cl.cam.ac.uk/techreports/UCAM-CL-TR-574.pdf): a digitized version of Sutherland's thesis.
* [Alan Kay discussing Sketchpad and showing its use](http://www.youtube.com/watch?v=mOZqRJzE8xg)

## Status

* DONE: Basic drawing of points, circles, and lines, rendered to <canvas>
* TODO: update the UI to have real affordances
* TODO: masters and instances
* TODO: constraints
  * The original user a linear constraint solver and a method for creating numerical approximation of non-linear constraints. The description in the thesis is not yet clear to me. We could alternately implement a quadratic constraint solver.

## License

Copyright © 2013 Adam Solove

Distributed under the Eclipse Public License, the same as Clojure.
