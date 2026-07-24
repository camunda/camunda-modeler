# Task

Based on the analyis of the client architecture (`./analysis`), explore two directions:

* Improve the react component architecture - modernize (i.e. get rid of react class components)
* De-react the application - end up with a `didi` / vanilla-js powered architecture where UI is a thin layer on top - the application itself is headless testable, driven via clear APIs - UI tests build on top

## Think freely

We offer a plug-in mechanism - consider to keep it as is, or change it to better fit into the new model.

## Definition of done

Each direction reasonably demonstrates:

* how the architecture and test flaws are being improved
* while keeping the good parts of the design
* examplified on key parts of the application -> from App.js to an editor

Result for each experiment is commited to its own branch.

Summary of each experiment is written into `./exploration` on this branch (`develop`).
