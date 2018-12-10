const ERROR_MESSAGE = {
  NO_INTERNET_CONNECTION: 'Could not connect to the server. Please check you Internet connection status.'
};


export default function getNetworkErrorMessage(error) {
  switch (error.code) {
  case 'ECONNRESET':
  case 'ECONNREFUSED':
  case 'ENOTFOUND':
    return ERROR_MESSAGE.NO_INTERNET_CONNECTION;
  }
}