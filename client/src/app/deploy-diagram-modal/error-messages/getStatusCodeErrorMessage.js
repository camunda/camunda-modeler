const ERROR_MESSAGE = {
  UNAUTHORIZED: 'The deployment was unauthorized. Please use valid credentials.',
  FORBIDDEN: 'The deployment was not permitted for your credentials. Please use different credentials.',
  NOT_FOUND: 'Could not find the provided URL. Please check the endpoint URL.',
  INTERNAL_SERVER_ERROR: 'There was an unknown server related issue. Please check the server status.',
  SERVER_UNAVAILABLE: 'Server is currently unavailable. Please try again later.'
};


export default function getStatusCodeErrorMessage(error) {
  switch (error.status) {
  case 401:
    return ERROR_MESSAGE.UNAUTHORIZED;
  case 403:
    return ERROR_MESSAGE.FORBIDDEN;
  case 404:
    return ERROR_MESSAGE.NOT_FOUND;
  case 500:
    return ERROR_MESSAGE.INTERNAL_SERVER_ERROR;
  case 503:
    return ERROR_MESSAGE.SERVER_UNAVAILABLE;
  }
}