import { SQSEvent, Context } from 'aws-lambda';
import logger from '../commons/logger';
import { TxMAEgressEvent } from '../data-types/interfaces';
import { sendSqsMessage } from '../services/send-sqs-message';
import assert from 'node:assert/strict';
import { addMetric } from '../commons/metrics';
import { MetricNames } from '../data-types/constants';

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  logger.addContext(context);

  assert(process.env['ACCOUNT_DELETION_SQS_QUEUE'], 'ACCOUNT_DELETION_SQS_QUEUE env variable is not set');
  const accountDeletionSqsQueue = process.env['ACCOUNT_DELETION_SQS_QUEUE'];

  if (!event.Records[0]) {
    logger.error('The event does not contain any records.');
    return;
  }

  for (const record of event.Records) {
    const body: TxMAEgressEvent = JSON.parse(record.body);
    if (body.event_name === 'AUTH_DELETE_ACCOUNT') {
      addMetric(MetricNames.RECIEVED_TXMA_ACCOUNT_DELETE);
      await sendSqsMessage(
        JSON.stringify({
          Message: record.body,
        }),
        accountDeletionSqsQueue,
      );
    }
  }

  return;
};
