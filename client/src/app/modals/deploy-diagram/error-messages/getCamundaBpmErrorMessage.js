const ERROR_MESSAGE = {
  BPMN_PARSING_ERROR: 'Server could not parse the diagram. Please check log for errors.'
};


export default function getCamundaBpmErrorMessage(error) {
  if (/^ENGINE-09005/.test(error.message)) {
    return ERROR_MESSAGE.BPMN_PARSING_ERROR;
  }
}
