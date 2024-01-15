import { defineFeature, loadFeature } from 'jest-cucumber';
import { generateRandomTestUserId } from '../../../utils/generate-random-test-user-id';
import { sendSQSEvent } from '../../../utils/send-sqs-message';
import { invokeGetAccountState } from '../../../utils/invoke-apigateway-lambda';

const feature = loadFeature('./tests/resources/features/aisGET/InvokeMultipleUsers-HappyPath.feature', {
  scenarioNameTemplate: (vars) => `${vars.scenarioTitle}(${vars.scenarioTags.join(',')})`,
});

defineFeature(feature, (test) => {
  //let testUserIdArray: string[];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  let response: any;
  const listOfUsers: string[] = [];

  test('Happy Path - create multiple users - Returns Expected Data for <aisEventType>', ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^I invoke an API to retrieve the (.*) status to the (.*) accounts. With history (.*)$/,
      async (aisEventType, numberOfUsers, historyValue) => {
        for (let i = 0; i <= numberOfUsers; i++) {
          let testUserId = generateRandomTestUserId();
          await sendSQSEvent(testUserId, aisEventType);
          response = await invokeGetAccountState(testUserId, historyValue);
          expect(response.intervention.description).toBe('AIS_ACCOUNT_SUSPENDED');
          expect(response.intervention.state.blocked).toBe(Boolean(false));
          expect(response.intervention.state.suspended).toBe(Boolean(true));
          expect(response.intervention.state.resetPassword).toBe(Boolean(false));
          expect(response.intervention.state.reproveIdentity).toBe(Boolean(false));
          listOfUsers.push(testUserId);
        }
        await Promise.allSettled(listOfUsers);
      },
    );

    and(/^I set the Id reset flag to TRUE$/, async () => {});

    when(/^I Invoke an API to view the records$/, async () => {});

    then(/^the expected (.*) is returned for the requested number of users$/, async (interventionType: string) => {});
  });
});
