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

import { getRootProcessFromXml } from '../Utilities';
import { getSingleFlowElement, isQuantMETask } from 'client/src/app/quantme/utilities/Utilities';
import { taskMatchesDetector } from 'client/src/app/quantme/replacement/QuantMEMatcher';

export async function matchesQRM(qrm, task) {
  console.log('Matching QRM %s and task with id %s!', qrm.qrmUrl, task.id);

  // check whether the detector is valid and contains exactly one QuantME task
  let rootProcess = await getRootProcessFromXml(qrm.detector);
  let detectorElement = getSingleFlowElement(rootProcess);
  if (detectorElement === undefined || !isQuantMETask(detectorElement)) {
    console.log('Unable to retrieve QuantME task from detector: ', qrm.detector);
    return false;
  }

  // check if QuantME task of the QRM matches the given task
  return taskMatchesDetector(detectorElement, task);
}
