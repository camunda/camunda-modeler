/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default {
  'tabName': 'Onboarding',
  'version': '6.0.0-chatmunda',
  'engine': 'Chatmunda 8.2',
  'intro': '',
  'startMessageIndex': 2,
  'messages': [
    {
      'prompt': 'Ok, can you provide a quick summary of the process?'
    },
    {
      'response': `Sure, here's a quick summary:

Step 1: Conduct Background Checks

Task 1: Obtain Candidate's Full Name, Date of Birth, and Social Security Number
Task 2: Submit Background Check Request to Third-Party Vendor
Task 3: Review Results of Background Check
Step 2: Complete Employment Agreement

Task 1: Generate Employment Agreement Template Based on Position and Location
Task 2: Review and Customize Employment Agreement with Candidate
Task 3: Obtain Signature from Candidate
Step 3: Gather Personal Information

Task 1: Ask for Full Name, Address, and Phone Number
Task 2: Ask for Emergency Contact Information
Task 3: Obtain Direct Deposit Information
Task 4: Collect Tax Forms
Step 4: Assign Company Email and Computer

Task 1: Assign Company Email Account
Task 2: Assign Company Computer
Task 3: Install Necessary Software and Applications
Step 5: Provide Overview of Policies and Procedures

Task 1: Schedule Meeting with HR Representative
Task 2: Review Company Handbook and Benefits Package
Task 3: Review Employee Expectations and Code of Conduct
Step 6: Complete Training and Certifications

Task 1: Identify Required Training and Certifications Based on Position and Location
Task 2: Schedule Required Training and Certifications
Task 3: Track Completion of Training and Certifications
Step 7: Set Up Performance Review Process

Task 1: Schedule First Performance Review Meeting
Task 2: Set Performance Goals with Employee
Task 3: Evaluate Performance and Provide Feedback
Task 4: Repeat Performance Review Process Annually`
    },
    {
      'prompt': "I wouldn't call this a quick summary. Can you tell me about possible exceptions?"
    },
    {
      'response': `Alright, here's a short list of things that could potentially go wrong during the onboarding process:

1. The background check vendor mistakenly identifies the candidate as a criminal mastermind and sends an FBI task force to arrest them on their first day of work.

2. The employment agreement template accidentally includes a clause requiring the candidate to donate a kidney to the CEO's cousin.

3. The candidate's personal information is accidentally inputted into the system as "Barack Obama" and they receive presidential-level security clearance and access.

4. The company computer is infected with a virus that turns all of the text on the screen into Wingdings font, rendering it impossible to read.

5. The HR representative assigned to review policies and procedures falls asleep during the meeting and wakes up hours later, having missed their next ten appointments.

6. The required training and certifications are all held in Antarctica, and the candidate is forced to spend six months living with a group of penguins in order to complete them.

7. The performance review process is conducted by a team of highly trained circus clowns, resulting in confusing feedback and balloon animals instead of actionable steps for improvement.

8. The company's direct deposit system accidentally deposits the candidate's salary into a random stranger's bank account, who then uses the funds to start their own competing business.

9. The emergency contact information provided by the candidate is for a fictional character, resulting in HR frantically calling "Batman" in the event of an emergency.

10. The company handbook is accidentally printed on toilet paper, resulting in a major lawsuit and the loss of all company stock.`
    },
    {
      'prompt': 'Thanks, I get it now.'
    },
    {
      'response': "That's great. Let me know if you want to know about the remaining 244 things that could potentially go wrong during the onboarding process."
    }
  ]
};
