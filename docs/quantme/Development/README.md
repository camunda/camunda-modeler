# Development

The QuantME Modeling and Transformation Framework is based on the Camunda Modeler and the major parts of the extensions are implemented using plugins for the Camunda Modeler.
Details about Camunda Modeler plugins can be found [here](../../plugins).

In the following, the list of current plugins is presented with a short description of the purpose of the plugins:

### [Linter-plugin](/resources/plugins/Linter-plugin)

Plugin to visualize warnings and errors in BPMN diagrams, developed by Camunda and maintained in [this](https://github.com/camunda/camunda-modeler-linter-plugin) repository.

### [QuantME-Linter-Extension-Plugin](/resources/plugins/QuantME-Linter-Extension-Plugin)

Extension of the Linter-plugin with QuantME specific linting rules.
Therefore, the plugin marks QuantME tasks in a diagram with a warning if:

1. Some of the required properties of the QuantME task are not set

2. There exists no suited [QRM](../QRM) to replace the QuantME task with the current property configuration.

If the warning is visualized at a QuantME task, the transformation to a native BPMN diagram is not possible at the moment.
Thus, the properties of the QuantME task must either be adapted or a new QRM has to be added to the [QRM-Repository](../QRM-Repository) for which the detector matches the current property configuration.

### [QuantME-CamundaPlugin](/resources/plugins/QuantME-CamundaPlugin)

Plugin containing the BPMN moddle extension for the QuantME tasks, as well as the property provider and palette extensions.
Furthermore, the transformation logic is implemented in this plugin.
Therefore, this plugin contains the major part of the QuantME extensions and should be extended, if, e.g., new tasks are added.

### [QuantME-ClientPlugin](/resources/plugins/QuantME-ClientPlugin)

Client extension plugin handling the [QRM-Repository](../QRM-Repository). 
Thus, it implements the communication with Github as well as the validation of the QRMs (availability of detector.bpmn and replacement.bpmn).
The currently available QRMs can be requested using the event bus and are then retrieved and send back via the event bus.
