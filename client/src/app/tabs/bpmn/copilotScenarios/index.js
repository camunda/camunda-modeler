import customerOnboardingRest from './customer-onboarding-rest.json';
import orderApproval from './order-approval.json';

export const SCENARIOS = [ customerOnboardingRest, orderApproval ];

export function getScenario(id) {
  return SCENARIOS.find(s => s.id === id) || null;
}
