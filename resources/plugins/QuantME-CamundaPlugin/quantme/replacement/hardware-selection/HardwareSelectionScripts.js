/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// script to invoke the hardware selection by the NISQ Analyzer based on the circuit created in the workflow
export var INVOKE_NISQ_ANALYZER_SCRIPT = 'import groovy.json.*\n' +
  '\n' +
  'def nisqAnalyzerEndpoint = execution.getVariable("nisq_analyzer_endpoint");\n' +
  'def circuitLanguage = execution.getVariable("circuit_language");\n' +
  'def quantumCircuit = execution.getVariable("quantum_circuit");\n' +
  '\n' +
  'if(nisqAnalyzerEndpoint == null || circuitLanguage == null || quantumCircuit == null){\n' +
  '   throw new org.camunda.bpm.engine.delegate.BpmnError("Nisq Analyzer endpoint, quantum circuit, and circuit language must be set!");\n' +
  '}\n' +
  '\n' +
  'def simulatorsAllowed = execution.getVariable("simulators_allowed");\n' +
  'if(simulatorsAllowed == null){\n' +
  '   simulatorsAllowed = "false";\n' +
  '}\n' +
  '\n' +
  'def allowedProvidersList = [];\n' +
  'if(execution.getVariable("providers") != null){\n' +
  '   allowedProvidersList = execution.getVariable("providers").split(",");\n' +
  '}\n' +
  '\n' +
  'def tokens = [:];\n' +
  'for (Object item : execution.getVariables().entrySet() ){\n' +
  '   def key = item.getKey();\n' +
  '   if(key.startsWith("token_")) {\n' +
  '       def provider = key.split("_")[1];\n' +
  '       tokens.putAt(provider, item.getValue());\n' +
  '   }\n' +
  '}\n' +
  '\n' +
  'def circuitUrl = execution.getVariable("camunda_endpoint");\n' +
  'circuitUrl = circuitUrl.endsWith("/") ? circuitUrl : circuitUrl + "/";\n' +
  'circuitUrl += "process-instance/" + execution.getProcessInstanceId() + "/variables/quantum_circuit/data";\n' +
  'def message = JsonOutput.toJson(["circuitUrl": circuitUrl, "simulatorsAllowed": simulatorsAllowed, "circuitLanguage": circuitLanguage, "tokens": tokens, "allowedProviders": allowedProvidersList]);\n' +
  'println "Sending message: " + message;\n' +
  '\n' +
  'try {\n' +
  '   def post = new URL(nisqAnalyzerEndpoint).openConnection();\n' +
  '   post.setRequestMethod("POST");\n' +
  '   post.setDoOutput(true);\n' +
  '   post.setRequestProperty("Content-Type", "application/json");\n' +
  '   post.setRequestProperty("accept", "application/json");\n' +
  '   post.getOutputStream().write(message.getBytes("UTF-8"));\n' +
  '\n' +
  '   def status = post.getResponseCode();\n' +
  '   if(status == 200){\n' +
  '       def resultText = post.getInputStream().getText();\n' +
  '       def slurper = new JsonSlurper();\n' +
  '       def json = slurper.parseText(resultText);\n' +
  '       def jobUrl = json.get("_links").get("self").get("href");\n' +
  '       println "NISQ Analyzer invocation resulted in the following job URL: " + jobUrl;\n' +
  '       execution.setVariable("nisq_analyzer_job_url", jobUrl);\n' +
  '   }else{\n' +
  '       throw new org.camunda.bpm.engine.delegate.BpmnError("Received status code " + status + " while invoking NISQ Analyzer!");\n' +
  '   }\n' +
  '} catch(org.camunda.bpm.engine.delegate.BpmnError e) {\n' +
  '   println e.errorCode;\n' +
  '   throw new org.camunda.bpm.engine.delegate.BpmnError(e.errorCode);\n' +
  '} catch(Exception e) {\n' +
  '   println e;\n' +
  '   throw new org.camunda.bpm.engine.delegate.BpmnError("Unable to connect to given endpoint: " + nisqAnalyzerEndpoint);\n' +
  '}';

// script to select one of the suitable QPUs provided by the NISQ Analyzer based on their current queue size
export var SELECT_ON_QUEUE_SIZE_SCRIPT = 'import groovy.json.*\n' +
  'import org.camunda.bpm.engine.variable.value.FileValue\n' +
  'import org.camunda.bpm.engine.variable.Variables\n' +
  '\n' +
  'def pollingUrl = execution.getVariable("nisq_analyzer_job_url");\n' +
  'println "Polling for NISQ Analyzer results at URL: " + pollingUrl\n' +
  'def ready = false;\n' +
  'def resultList = [];\n' +
  'while(ready == false) {\n' +
  '   println "Waiting 10 seconds for next polling request to the NISQ Analyzer at URL: " + pollingUrl\n' +
  '   sleep(10000)\n' +
  '   def get = new URL(pollingUrl).openConnection();\n' +
  '   get.setRequestMethod("GET");\n' +
  '   get.setDoOutput(true);\n' +
  '\n' +
  '   def status = get.getResponseCode();\n' +
  '   if(status != 200){\n' +
  '       throw new org.camunda.bpm.engine.delegate.BpmnError("Received invalid status code during polling: " + status);\n' +
  '   }\n' +
  '   def resultText = get.getInputStream().getText();\n' +
  '   def slurper = new JsonSlurper();\n' +
  '   def json = slurper.parseText(resultText);\n' +
  '   ready = json.get("ready");\n' +
  '   if(ready == true){\n' +
  '       resultList = json.get("qpuSelectionResultList");\n' +
  '   }\n' +
  '}\n' +
  '\n' +
  'println "NISQ Analyzer job changed status to ready!"\n' +
  'println "Received " + resultList.size + " possible QPUs for the execution...";\n' +
  '\n' +
  'if(resultList.size == 0){\n' +
  '   throw new org.camunda.bpm.engine.delegate.BpmnError("Found no suitable QPU, aborting!");\n' +
  '}\n' +
  '\n' +
  'def sortedList = resultList.sort { it.queueSize };\n' +
  'def selectedQpu = resultList.get(0);\n' +
  'def providerName = selectedQpu.get("provider");\n' +
  'def qpuName = selectedQpu.get("qpu");\n' +
  'def language = selectedQpu.get("transpiledLanguage");\n' +
  'println "Selected QPU " + qpuName + " from provider " + providerName + "!";\n' +
  'execution.setVariable("selected_provider", providerName);\n' +
  'execution.setVariable("selected_qpu", qpuName);\n' +
  'execution.setVariable("circuit_language", language);\n' +
  'execution.setVariable("already_selected", true);\n' +
  'def circuitFile = new File("circuit.tmp");\n' +
  'circuitFile.write(selectedQpu.get("transpiledCircuit"));\n' +
  'FileValue typedFileValue = Variables\n' +
  '  .fileValue("circuit.tmp")\n' +
  '  .file(circuitFile)\n' +
  '  .mimeType("text/plain")\n' +
  '  .encoding("UTF-8")\n' +
  '  .create();\n' +
  'execution.setVariable("quantum_circuit", typedFileValue);\n';

// Workaround to store the workflow fragment to transform as the Camunda engine only allows variables up to 4000 characters.
// Thus, a script is used to store it as a file variable during runtime which is allowed to be larger.
export var RETRIEVE_FRAGMENT_SCRIPT_PREFIX = 'import org.camunda.bpm.engine.variable.value.FileValue\n' +
  'import org.camunda.bpm.engine.variable.Variables\n' +
  'def xml = \'';

export var RETRIEVE_FRAGMENT_SCRIPT_SUFFIX = '\'\n' +
  'def file = new File("fragment.tmp");\n' +
  'file.write(xml);\n' +
  'FileValue typedFileValue = Variables\n' +
  '  .fileValue("fragment.tmp")\n' +
  '  .file(file)\n' +
  '  .mimeType("text/plain")\n' +
  '  .encoding("UTF-8")\n' +
  '  .create();\n' +
  'execution.setVariable("hardware_selection_fragment", typedFileValue);\n';

// script to invoke the transformation of the workflow fragment within the QuantumHardwareSelectionSubprocess depending on the hardware selection
export var INVOKE_TRANSFORMATION_SCRIPT = 'import groovy.json.*\n' +
  'import org.camunda.bpm.engine.variable.value.FileValue\n' +
  '\n' +
  'def transformationUrl = execution.getVariable("transformation_framework_endpoint");\n' +
  'transformationUrl = transformationUrl.endsWith("/") ? transformationUrl : transformationUrl + "/";\n' +
  'transformationUrl += "quantme/workflows";\n' +
  'println "Posting for transformation using the following URL: " + transformationUrl + "/hardware-selection"\n' +
  '\n' +
  'def circuitUrl = execution.getVariable("camunda_endpoint");\n' +
  'circuitUrl = circuitUrl.endsWith("/") ? circuitUrl : circuitUrl + "/";\n' +
  'circuitUrl += "process-instance/" + execution.getProcessInstanceId() + "/variables/quantum_circuit/data";\n' +
  'println "Circuit accessible through URL: " + circuitUrl\n' +
  '\n' +
  'FileValue fileVariable = execution.getVariableTyped("hardware_selection_fragment");\n' +
  'def fragment = fileVariable.getValue().getText("UTF-8");\n' +
  'def circuitLanguage = execution.getVariable("circuit_language");\n' +
  'def providerName = execution.getVariable("selected_provider");\n' +
  'def qpuName = execution.getVariable("selected_qpu");\n' +
  'def message = JsonOutput.toJson(["xml": fragment, "circuitLanguage": circuitLanguage, "provider": providerName, "qpu": qpuName]);\n' +
  'println "Sending message: " + message;\n' +
  '\n' +
  'def pollingUrl = "";\n' +
  'try {\n' +
  '   def post = new URL(transformationUrl + "/hardware-selection").openConnection();\n' +
  '   post.setRequestMethod("POST");\n' +
  '   post.setDoOutput(true);\n' +
  '   post.setRequestProperty("Content-Type", "application/json");\n' +
  '   post.setRequestProperty("accept", "application/json");\n' +
  '   post.getOutputStream().write(message.getBytes("UTF-8"));\n' +
  '\n' +
  '   def status = post.getResponseCode();\n' +
  '   if(status == 201){\n' +
  '       def resultText = post.getInputStream().getText();\n' +
  '       def slurper = new JsonSlurper();\n' +
  '       def json = slurper.parseText(resultText);\n' +
  '       pollingUrl = transformationUrl + "/" + json.get("id");\n' +
  '       println "Transformation Framework returned job with URL: " + pollingUrl;\n' +
  '       execution.setVariable("transformation_framework_job_url", pollingUrl);\n' +
  '   }else{\n' +
  '       throw new org.camunda.bpm.engine.delegate.BpmnError("Received status code " + status + " while invoking Transformation Framework!");\n' +
  '   }\n' +
  '} catch(org.camunda.bpm.engine.delegate.BpmnError e) {\n' +
  '   println e.errorCode;\n' +
  '   throw new org.camunda.bpm.engine.delegate.BpmnError(e.errorCode);\n' +
  '} catch(Exception e) {\n' +
  '   println e;\n' +
  '   throw new org.camunda.bpm.engine.delegate.BpmnError("Unable to connect to given endpoint: " + transformationUrl);\n' +
  '}';

// script to poll for the result of the transformation and deployment
export var POLL_FOR_TRANSFORMATION_SCRIPT = 'import groovy.json.*\n' +
  'def pollingUrl = execution.getVariable("transformation_framework_job_url");\n' +
  'println "Polling for successful transformation at: " + pollingUrl;\n' +
  '\n' +
  'def transformationStatus = false;\n' +
  'def result = [];\n' +
  'while(transformationStatus != "deployed") {\n' +
  '   println "Waiting 10 seconds for next polling request to the Transformation Framework at URL: " + pollingUrl\n' +
  '   sleep(10000)\n' +
  '   def get = new URL(pollingUrl).openConnection();\n' +
  '   get.setRequestMethod("GET");\n' +
  '   get.setDoOutput(true);\n' +
  '\n' +
  '   if(get.getResponseCode() != 200){\n' +
  '       throw new org.camunda.bpm.engine.delegate.BpmnError("Received invalid status code during polling: " + get.getResponseCode());\n' +
  '   }\n' +
  '   def resultText = get.getInputStream().getText();\n' +
  '   def slurper = new JsonSlurper();\n' +
  '   def json = slurper.parseText(resultText);\n' +
  '   def workflow = json.get("workflow");\n' +
  '   transformationStatus = workflow.get("status");\n' +
  '   if(transformationStatus == "deployed"){\n' +
  '       def deployedProcessDefinition = workflow.get("deployedProcessDefinition");\n' +
  '       println "Resulting definition of deployed process: " + deployedProcessDefinition\n' +
  '       execution.setVariable("fragment_endpoint", deployedProcessDefinition.key);\n' +
  '   }\n' +
  '}';
