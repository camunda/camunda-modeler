# QuantME Replacement Models (QRMs)

TODO

### Detector

TODO

#### Alternative Properties

Alternative properties are properties of QuantME tasks for which exactly one attribute has to be set.
For example, the `QuantumCircuitLoadingTask` defines the two alternative properties `quantumCircuit` and `url`.
This allows to specify alternative possibilities to load the quantum circuit into the workflow.
However, if none of the properties is set, it is not possible to load the quantum circuit successfully.
In the same way, if both properties are set, it is unclear which circuit to use.
Therefore, exactly one of these alternative properties has to be set for each task in a QuantME workflow.

In the detector, it is possible to set values for multiple alternative properties if the replacement fragment can handle different alternatives.
However, in contrast to all other properties it is also possible to leave alternative properties empty if at least one of them is set.

There are currently two QuantME task types using alternative properties: 

1. `QuantumCircuitLoadingTask`: The properties `quantumCircuit` and `url` are alternatives
2. `OracleExpansionTask`: The properties `oracleCircuit` and `oracleURL` are alternatives

#### Detector Task Matching

TODO

### Replacement Fragment

TODO
