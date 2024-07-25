export const LOGS_PREFIX_SENSITIVE_INFO = 'Sensitive info -';
export const LOGS_PREFIX_INVALID_CONFIG = 'Invalid configuration -';

export enum MetricNames {
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_QUERY_ERROR_NO_RESPONSE = 'DB_QUERY_ERROR_NO_RESPONSE',
  INVALID_SUBJECT_ID = 'INVALID_SUBJECT_ID',
  DB_QUERY_ERROR_TOO_MANY_ITEMS = 'DB_QUERY_ERROR_TOO_MANY_ITEMS',
  ACCOUNT_IS_MARKED_AS_DELETED = 'ACCOUNT_IS_MARKED_AS_DELETED',
  INVALID_EVENT_RECEIVED = 'INVALID_EVENT_RECEIVED',
  INTERVENTION_IGNORED_IN_FUTURE = 'INTERVENTION_IGNORED_IN_FUTURE',
  STATE_TRANSITION_NOT_ALLOWED_OR_IGNORED = 'STATE_TRANSITION_NOT_ALLOWED_OR_IGNORED',
  INTERVENTION_CODE_NOT_FOUND_IN_CONFIG = 'INTERVENTION_CODE_NOT_FOUND_IN_CONFIG',
  STATE_NOT_FOUND_IN_CURRENT_CONFIG = 'STATE_NOT_FOUND_IN_CURRENT_CONFIG',
  TRANSITION_SAME_AS_CURRENT_STATE = 'TRANSITION_SAME_AS_CURRENT_STATE',
  INTERVENTION_DID_NOT_HAVE_NAME_IN_CURRENT_CONFIG = 'INTERVENTION_DID_NOT_HAVE_NAME_IN_CURRENT_CONFIG',
  PUBLISHED_EVENT_TO_TXMA = 'PUBLISHED_EVENT_TO_TXMA',
  ERROR_PUBLISHING_EVENT_TO_TXMA = 'ERROR_PUBLISHING_EVENT_TO_TXMA',
  NO_TRANSITIONS_FOUND_IN_CONFIG = 'NO_TRANSITIONS_FOUND_IN_CONFIG',
  INVALID_STATE_ENGINE_CONFIGURATION = 'INVALID_STATE_ENGINE_CONFIGURATION',
  DB_UPDATE_ERROR = 'DB_UPDATE_ERROR',
  MARK_AS_DELETED_SUCCEEDED = 'MARK_AS_DELETED_SUCCEEDED',
  MARK_AS_DELETED_FAILED = 'MARK_AS_DELETED_FAILED',
  INTERVENTION_EVENT_STALE = 'INTERVENTION_EVENT_STALE',
  INTERVENTION_EVENT_APPLIED = 'INTERVENTION_EVENT_APPLIED',
  INVALID_SCHEMA = 'INVALID_SCHEMA',
  IDENTITY_NOT_SUFFICIENTLY_PROVED = 'IDENTITY_NOT_SUFFICIENTLY_PROVED',
  INVALID_HISTORY_STRING = 'INVALID_HISTORY_STRING',
  EVENT_DELIVERY_LATENCY = 'EVENT_DELIVERY_LATENCY',
  ACCOUNTS_BLOCKED = 'ACCOUNTS_BLOCKED',
  ACCOUNTS_SUSPENDED = 'ACCOUNTS_SUSPENDED',
  TIME_TO_RESOLVE = 'TIME_TO_RESOLVE',
}

export const noMetadata: { key: string; value: string }[] = [];
export enum EventsEnum {
  FRAUD_SUSPEND_ACCOUNT = 'FRAUD_SUSPEND_ACCOUNT',
  FRAUD_UNSUSPEND_ACCOUNT = 'FRAUD_UNSUSPEND_ACCOUNT',
  FRAUD_BLOCK_ACCOUNT = 'FRAUD_BLOCK_ACCOUNT',
  FRAUD_UNBLOCK_ACCOUNT = 'FRAUD_UNBLOCK_ACCOUNT',
  FRAUD_FORCED_USER_PASSWORD_RESET = 'FRAUD_FORCED_USER_PASSWORD_RESET', //pragma: allowlist secret
  FRAUD_FORCED_USER_IDENTITY_REVERIFICATION = 'FRAUD_FORCED_USER_IDENTITY_REVERIFICATION',
  FRAUD_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_REVERIFICATION = 'FRAUD_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_REVERIFICATION', //pragma: allowlist secret
  IPV_ACCOUNT_INTERVENTION_END = 'IPV_ACCOUNT_INTERVENTION_END',
  AUTH_PASSWORD_RESET_SUCCESSFUL = 'AUTH_PASSWORD_RESET_SUCCESSFUL', //pragma: allowlist secret
  AUTH_PASSWORD_RESET_SUCCESSFUL_FOR_TEST_CLIENT = 'AUTH_PASSWORD_RESET_SUCCESSFUL_FOR_TEST_CLIENT', //pragma: allowlist secret
}
export enum TriggerEventsEnum {
  TICF_ACCOUNT_INTERVENTION = 'TICF_ACCOUNT_INTERVENTION',
  IPV_ACCOUNT_INTERVENTION_END = 'IPV_ACCOUNT_INTERVENTION_END',
  AUTH_PASSWORD_RESET_SUCCESSFUL = 'AUTH_PASSWORD_RESET_SUCCESSFUL', //pragma: allowlist secret
  AUTH_PASSWORD_RESET_SUCCESSFUL_FOR_TEST_CLIENT = 'AUTH_PASSWORD_RESET_SUCCESSFUL_FOR_TEST_CLIENT', //pragma: allowlist secret
}
export enum AISInterventionTypes {
  AIS_NO_INTERVENTION = 'AIS_NO_INTERVENTION',
  AIS_ACCOUNT_SUSPENDED = 'AIS_ACCOUNT_SUSPENDED',
  AIS_ACCOUNT_UNSUSPENDED = 'AIS_ACCOUNT_UNSUSPENDED',
  AIS_ACCOUNT_BLOCKED = 'AIS_ACCOUNT_BLOCKED',
  AIS_ACCOUNT_UNBLOCKED = 'AIS_ACCOUNT_UNBLOCKED',
  AIS_FORCED_USER_PASSWORD_RESET = 'AIS_FORCED_USER_PASSWORD_RESET', //pragma: allowlist secret
  AIS_FORCED_USER_IDENTITY_VERIFY = 'AIS_FORCED_USER_IDENTITY_VERIFY',
  AIS_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_VERIFY = 'AIS_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_VERIFY', //pragma: allowlist secret
}

export enum ActiveStateActions {
  RESET_PASSWORD = 'reset_password', //pragma: allowlist secret
  REPROVE_IDENTITY = 'reprove_identity',
  RESET_PASSWORD_AND_REPROVE_IDENTITY = 'reset_password_and_reprove_identity', //pragma: allowlist secret
}

export enum State {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PERMANENTLY_SUSPENDED = 'permanently_suspended',
  DELETED = 'deleted',
}

export const userLedActionList: EventsEnum[] = [
  EventsEnum.IPV_ACCOUNT_INTERVENTION_END,
  EventsEnum.AUTH_PASSWORD_RESET_SUCCESSFUL,
  EventsEnum.AUTH_PASSWORD_RESET_SUCCESSFUL_FOR_TEST_CLIENT,
];

export const COMPONENT_ID = 'ACCOUNT_INTERVENTION_SERVICE';

export enum HistoryStringParts {
  EVENT_TIMESTAMP_MS,
  COMPONENT_ID,
  INTERVENTION_CODE,
  INTERVENTION_REASON,
  ORIGINATING_COMPONENT_ID,
  ORIGINATOR_REFERENCE_ID,
  REQUESTER_ID,
}

export const expectedHistoryStringLength = Object.keys(HistoryStringParts).length / 2;
