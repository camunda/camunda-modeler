# Environment Variables

In the following, all environment variables that can be used to customize the QuantME Modeling and Transformation Framework are summarized.

### Overview

* ```PORT``` (default: 8081): The port to run the [REST API](../API) on. 

* ```HEADLESS``` (default: false): If set to true, the framework is executed without displaying the UI. 
This can for example be used if only the API is required and not the graphical modeler.

* ```QRM_USERNAME``` (default: ' '): Defines the Github username to access the [QRM-Repository](../QRM-Repository)

* ```QRM_REPONAME``` (default: ' '): Defines the Github repository name to access the [QRM-Repository](../QRM-Repository)

* ```CAMUNDA_ENDPOINT``` (default: 'http://localhost:8080/engine-rest'): Defines the endpoint of the Camunda engine to deploy workflows to

* ```OPENTOSCA_ENDPOINT``` (default: 'http://localhost:1337/csars'): Defines the endpoint of the OpenTOSCA container to deploy services with

### Setting the Environment Variables

When spinning up the framework in development mode, add the environment variables to the npm command:

```javascript
PORT=8088 QRM_USERNAME='TEST_USER' QRM_REPONAME='TEST_REPO' npm run dev
```

If using the build product, the environment variables can be passed on start-up depending on the operating system, e.g., for Ubuntu:

 ```javascript
 PORT=3000 HEADLESS=true ./quantme-modeler
 ```
