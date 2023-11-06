import {
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  UpdateItemCommand,
  UpdateItemCommandInput,
  UpdateItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import logger from '../commons/logger';
import { LOGS_PREFIX_SENSITIVE_INFO, MetricNames } from '../data-types/constants';
import { AppConfigService } from './app-config-service';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import tracer from '../commons/tracer';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { logAndPublishMetric } from '../commons/metrics';
import { TooManyRecordsError } from '../data-types/errors';
import { getCurrentTimestamp } from '../commons/get-current-timestamp';
import { DynamoDBStateResult } from '../data-types/interfaces';

const appConfig = AppConfigService.getInstance();
export class DynamoDatabaseService {
  private dynamoClient: DynamoDBClient;
  private readonly tableName: string;

  public constructor(tableName: string) {
    this.dynamoClient = tracer.captureAWSv3Client(
      new DynamoDBClient({
        region: AppConfigService.getInstance().awsRegion,
        maxAttempts: 2,
        requestHandler: new NodeHttpHandler({ requestTimeout: 5000 }),
      }),
    );
    this.tableName = tableName;
  }

  /**
   * A function to retrieve the DynamoDB record according to the given userId
   *
   * @param userId - the userId that comes from the request
   */
  public async retrieveRecordsByUserId(userId: string) {
    logger.debug(`${LOGS_PREFIX_SENSITIVE_INFO} Attempting request to dynamo db, with ID : ${userId}`);
    const parameters: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: '#pk = :id_value',
      ExpressionAttributeNames: { '#pk': 'pk' },
      ExpressionAttributeValues: { ':id_value': { S: userId } },
      ProjectionExpression: 'blocked, suspended, resetPassword, reproveIdentity, isAccountDeleted',
    };

    const response: QueryCommandOutput = await this.dynamoClient.send(new QueryCommand(parameters));
    if (!response.Items) {
      const errorMessage = 'DynamoDB may have failed to query, returned a null response.';
      logger.error(errorMessage);
      logAndPublishMetric(MetricNames.DB_QUERY_ERROR_NO_RESPONSE);
      throw new Error(errorMessage);
    }

    if (response.Items.length > 1) {
      const errorMessage = 'DynamoDB returned more than one element.';
      logger.error(errorMessage);
      logAndPublishMetric(MetricNames.DB_QUERY_ERROR_TOO_MANY_ITEMS);
      throw new TooManyRecordsError(errorMessage);
    }
    return response.Items[0] ? (unmarshall(response.Items[0]) as DynamoDBStateResult) : undefined;
  }

  /**
   * Function to retrieve the full record from DynamoDB
   * @param userId - user ID passed in via path params
   * @returns - record from dynamoDB
   */
  public async queryRecordFromDynamoDatabase(userId: string) {
    logger.debug(`${LOGS_PREFIX_SENSITIVE_INFO} Attempting request to dynamo db, with ID : ${userId}`);
    const parameters: QueryCommandInput = {
      TableName: this.tableName,
      KeyConditionExpression: '#pk = :id_value',
      ExpressionAttributeNames: { '#pk': 'pk' },
      ExpressionAttributeValues: { ':id_value': { S: userId } },
    };

    const response: QueryCommandOutput = await this.dynamoClient.send(new QueryCommand(parameters));
    if (!response.Items) {
      const errorMessage = 'DynamoDB may have failed to query, returned a null response.';
      logger.error(errorMessage);
      logAndPublishMetric(MetricNames.DB_QUERY_ERROR_NO_RESPONSE);
      throw new Error(errorMessage);
    }

    if (response.Items.length > 1) {
      const errorMessage = 'DynamoDB returned more than one element.';
      logger.error(errorMessage);
      logAndPublishMetric(MetricNames.DB_QUERY_ERROR_TOO_MANY_ITEMS);
      throw new TooManyRecordsError(errorMessage);
    }
    return response.Items[0] ? unmarshall(response.Items[0]) : undefined;
  }

  /**
   * A function to take a partially formed UpdateItemCommand input, form the full command, and send the command
   * @param userId - id of the user whose record is being updated
   * @param partialInput - Partial object for command input
   */
  public async updateUserStatus(
    userId: string,
    partialInput: Partial<UpdateItemCommandInput>,
  ): Promise<UpdateItemCommandOutput> {
    const commandInput: UpdateItemCommandInput = {
      TableName: this.tableName,
      Key: { pk: { S: userId } },
      ...partialInput,
    };
    const command = new UpdateItemCommand(commandInput);
    return await this.dynamoClient.send(command);
  }

  public async updateDeleteStatus(userId: string) {
    const ttl = getCurrentTimestamp().seconds + appConfig.maxRetentionSeconds;
    const commandInput: UpdateItemCommandInput = {
      TableName: this.tableName,
      Key: { pk: { S: userId } },
      UpdateExpression: 'SET #isAccountDeleted = :isAccountDeleted, #ttl = :ttl',
      ExpressionAttributeNames: {
        '#isAccountDeleted': 'isAccountDeleted',
        '#ttl': 'ttl',
      },
      ExpressionAttributeValues: {
        ':isAccountDeleted': { BOOL: true },
        ':ttl': { N: ttl.toString() },
        ':false': { BOOL: false },
      },
      ConditionExpression:
        'attribute_exists(pk) AND (attribute_not_exists(isAccountDeleted) OR isAccountDeleted = :false)',
    };
    const command = new UpdateItemCommand(commandInput);
    try {
      const response = await this.dynamoClient.send(command);
      logger.info(`${LOGS_PREFIX_SENSITIVE_INFO} Account ${userId} marked as deleted.`);
      if (!response) {
        const errorMessage = 'DynamoDB may have failed to update items, returned a null response.';
        logger.error(errorMessage);
        logAndPublishMetric(MetricNames.DB_UPDATE_ERROR);
        return;
      }
      logAndPublishMetric(MetricNames.MARK_AS_DELETED_SUCCEEDED);
      return response;
    } catch (error: any) {
      console.log(error);
      if (error.name === 'ValidationException') {
        throw new Error();
      }
      const errorMessage = `${LOGS_PREFIX_SENSITIVE_INFO} Error updating item with pk ${userId}.`;
      logger.error(errorMessage);
      logAndPublishMetric(MetricNames.DB_UPDATE_ERROR);
    }
  }
}
