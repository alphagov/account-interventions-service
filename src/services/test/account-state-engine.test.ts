import {
  AccountStateEngine,
} from '../account-states/account-state-engine';
import {AISInterventionTypes, EventsEnum, MetricNames} from '../../data-types/constants';
import { StateTransitionError } from '../../data-types/errors';
import { logAndPublishMetric } from '../../commons/metrics';
import { TransitionConfigurationInterface } from "../../data-types/interfaces";

const accountStateEngine = AccountStateEngine.getInstance();

const accountIsSuspended = {
  blocked: false,
  suspended: true,
  resetPassword: false,
  reproveIdentity: false,
};

const accountNeedsPswReset = {
  blocked: false,
  suspended: true,
  resetPassword: true,
  reproveIdentity: false,
};

const accountIsOkay = {
  blocked: false,
  suspended: false,
  resetPassword: false,
  reproveIdentity: false,
};

const accountNeedsIDReset = {
  blocked: false,
  suspended: true,
  resetPassword: false,
  reproveIdentity: true,
};

const accountNeedsIDResetAdnPswReset = {
  blocked: false,
  suspended: true,
  resetPassword: true,
  reproveIdentity: true,
};

const accountIsBlocked = {
  blocked: true,
  suspended: false,
  resetPassword: false,
  reproveIdentity: false,
};

const blockAccountUpdate = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#INT': 'intervention',
    '#AA': 'appliedAt',
    '#H': 'history',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: true },
    ':s': { BOOL: false },
    ':rp': { BOOL: false },
    ':ri': { BOOL: false },
    ':ua': { N: '1234567890' },
    ':int': { S: 'AIS_ACCOUNT_BLOCKED' },
    ':aa': { N: '1234567890' },
    ':empty_list': { L: [] },
    ':h': { L: [{ S: 'AIS_ACCOUNT_BLOCKED' }] },
  },
  UpdateExpression:
    'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #INT = :int, #AA = :aa, #H = list_append(if_not_exists(#H, :empty_list), :h)',
};

const unblockAccountUpdate = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#INT': 'intervention',
    '#AA': 'appliedAt',
    '#H': 'history',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: false },
    ':rp': { BOOL: false },
    ':ri': { BOOL: false },
    ':ua': { N: '1234567890' },
    ':int': { S: 'AIS_ACCOUNT_UNBLOCKED' },
    ':aa': { N: '1234567890' },
    ':empty_list': { L: [] },
    ':h': { L: [{ S: 'AIS_ACCOUNT_UNBLOCKED' }] },
  },
  UpdateExpression:
    'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #INT = :int, #AA = :aa, #H = list_append(if_not_exists(#H, :empty_list), :h)',
};

const suspendAccountUpdate = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#INT': 'intervention',
    '#AA': 'appliedAt',
    '#H': 'history',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: true },
    ':rp': { BOOL: false },
    ':ri': { BOOL: false },
    ':ua': { N: '1234567890' },
    ':int': { S: 'AIS_ACCOUNT_SUSPENDED' },
    ':aa': { N: '1234567890' },
    ':empty_list': { L: [] },
    ':h': { L: [{ S: 'AIS_ACCOUNT_SUSPENDED' }] },
  },
  UpdateExpression:
    'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #INT = :int, #AA = :aa, #H = list_append(if_not_exists(#H, :empty_list), :h)',
};

const unsuspendAccountUpdate = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#INT': 'intervention',
    '#AA': 'appliedAt',
    '#H': 'history',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: false },
    ':rp': { BOOL: false },
    ':ri': { BOOL: false },
    ':ua': { N: '1234567890' },
    ':int': { S: 'AIS_ACCOUNT_UNSUSPENDED' },
    ':aa': { N: '1234567890' },
    ':empty_list': { L: [] },
    ':h': { L: [{ S: 'AIS_ACCOUNT_UNSUSPENDED' }] },
  },
  UpdateExpression:
    'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #INT = :int, #AA = :aa, #H = list_append(if_not_exists(#H, :empty_list), :h)',
};

const passwordResetRequiredUpdate = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#INT': 'intervention',
    '#AA': 'appliedAt',
    '#H': 'history',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: true },
    ':rp': { BOOL: true },
    ':ri': { BOOL: false },
    ':ua': { N: '1234567890' },
    ':int': { S: 'AIS_FORCED_USER_PASSWORD_RESET' },
    ':aa': { N: '1234567890' },
    ':empty_list': { L: [] },
    ':h': { L: [{ S: 'AIS_FORCED_USER_PASSWORD_RESET' }] },
  },
  UpdateExpression:
    'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #INT = :int, #AA = :aa, #H = list_append(if_not_exists(#H, :empty_list), :h)',
};

const idResetRequiredUpdate = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#INT': 'intervention',
    '#AA': 'appliedAt',
    '#H': 'history',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: true },
    ':rp': { BOOL: false },
    ':ri': { BOOL: true },
    ':ua': { N: '1234567890' },
    ':int': { S: 'AIS_FORCED_USER_IDENTITY_VERIFY' },
    ':aa': { N: '1234567890' },
    ':empty_list': { L: [] },
    ':h': { L: [{ S: 'AIS_FORCED_USER_IDENTITY_VERIFY' }] },
  },
  UpdateExpression:
    'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #INT = :int, #AA = :aa, #H = list_append(if_not_exists(#H, :empty_list), :h)',
};

const pswAndIdResetRequiredUpdate = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#INT': 'intervention',
    '#AA': 'appliedAt',
    '#H': 'history',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: true },
    ':rp': { BOOL: true },
    ':ri': { BOOL: true },
    ':ua': { N: '1234567890' },
    ':int': { S: 'AIS_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_VERIFY' },
    ':aa': { N: '1234567890' },
    ':empty_list': { L: [] },
    ':h': { L: [{ S: 'AIS_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_VERIFY' }] },
  },
  UpdateExpression:
    'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #INT = :int, #AA = :aa, #H = list_append(if_not_exists(#H, :empty_list), :h)',
};

const pswResetSuccessfulUpdateUnsuspended = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#RPswdA': 'resetPasswordAt',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: false },
    ':rp': { BOOL: false },
    ':ri': { BOOL: false },
    ':ua': { N: '1234567890' },
    ':rpswda': { N: '1234567890' },
  },
  UpdateExpression: 'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #RPswdA = :rpswda',
};

const pswResetSuccessfulUpdateSuspended = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#RPswdA': 'resetPasswordAt',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: true },
    ':rp': { BOOL: false },
    ':ri': { BOOL: true },
    ':ua': { N: '1234567890' },
    ':rpswda': { N: '1234567890' },
  },
  UpdateExpression: 'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #RPswdA = :rpswda',
};

const idResetSuccessfulUpdateUnsuspended = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#RIdA': 'reprovedIdentityAt',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: false },
    ':rp': { BOOL: false },
    ':ri': { BOOL: false },
    ':ua': { N: '1234567890' },
    ':rida': { N: '1234567890' },
  },
  UpdateExpression: 'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #RIdA = :rida',
};

const idResetSuccessfulUpdateSuspended = {
  ExpressionAttributeNames: {
    '#B': 'blocked',
    '#S': 'suspended',
    '#RP': 'resetPassword',
    '#RI': 'reproveIdentity',
    '#UA': 'updatedAt',
    '#RIdA': 'reprovedIdentityAt',
  },
  ExpressionAttributeValues: {
    ':b': { BOOL: false },
    ':s': { BOOL: true },
    ':rp': { BOOL: true },
    ':ri': { BOOL: false },
    ':ua': { N: '1234567890' },
    ':rida': { N: '1234567890' },
  },
  UpdateExpression: 'SET #B = :b, #S = :s, #RP = :rp, #RI = :ri, #UA = :ua, #RIdA = :rida',
};
jest.mock('@aws-lambda-powertools/logger');
jest.mock('../../commons/metrics');
jest.mock('../../commons/get-current-timestamp', () => ({
  getCurrentTimestamp: jest.fn().mockImplementation(() => {
    return {
      milliseconds: 1_234_567_890,
      isoString: 'today',
      seconds: 1_234_567,
    };
  }),
}));
describe('account-state-service', () => {
  describe('Successful state transitions', () => {
    describe('from no intervention', () => {
      it.each([
        [EventsEnum.FRAUD_BLOCK_ACCOUNT, undefined, blockAccountUpdate],
        [EventsEnum.FRAUD_SUSPEND_ACCOUNT, undefined, suspendAccountUpdate],
        [EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET, undefined, passwordResetRequiredUpdate],
        [EventsEnum.FRAUD_FORCED_USER_IDENTITY_REVERIFICATION, undefined, idResetRequiredUpdate],
        [
          EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_REVERIFICATION,
          undefined,
          pswAndIdResetRequiredUpdate,
        ],
      ])('%p', (intervention, retrievedAccountState, command) => {
        const partialCommand = accountStateEngine.applyEventTransition(intervention, retrievedAccountState);
        expect(partialCommand).toEqual(command);
      });
    });

    describe('from unsuspended', () => {
      it.each([
        [EventsEnum.FRAUD_BLOCK_ACCOUNT, accountIsOkay, blockAccountUpdate],
        [EventsEnum.FRAUD_SUSPEND_ACCOUNT, accountIsOkay, suspendAccountUpdate],
        [EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET, accountIsOkay, passwordResetRequiredUpdate],
        [EventsEnum.FRAUD_FORCED_USER_IDENTITY_REVERIFICATION, accountIsOkay, idResetRequiredUpdate],
        [
          EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_REVERIFICATION,
          accountIsOkay,
          pswAndIdResetRequiredUpdate,
        ],
      ])('%p', (intervention, retrievedAccountState, command) => {
        const partialCommand = accountStateEngine.applyEventTransition(intervention, retrievedAccountState);
        expect(partialCommand).toEqual(command);
      });
    });

    describe('from suspended no user action', () => {
      it.each([
        [EventsEnum.FRAUD_UNSUSPEND_ACCOUNT, accountIsSuspended, unsuspendAccountUpdate],
        [EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET, accountIsSuspended, passwordResetRequiredUpdate],
        [EventsEnum.FRAUD_FORCED_USER_IDENTITY_REVERIFICATION, accountIsSuspended, idResetRequiredUpdate],
        [
          EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_REVERIFICATION,
          accountIsSuspended,
          pswAndIdResetRequiredUpdate,
        ],
        [EventsEnum.FRAUD_BLOCK_ACCOUNT, accountIsSuspended, blockAccountUpdate],
      ])('%p', (intervention, retrievedAccountState, command) => {
        const partialCommand = accountStateEngine.applyEventTransition(intervention, retrievedAccountState);
        expect(logAndPublishMetric).not.toHaveBeenCalled();
        expect(partialCommand).toEqual(command);
      });
    });

    describe('from suspended psw reset required', () => {
      it.each([
        [EventsEnum.FRAUD_BLOCK_ACCOUNT, accountNeedsPswReset, blockAccountUpdate],
        [EventsEnum.FRAUD_UNSUSPEND_ACCOUNT, accountNeedsPswReset, unsuspendAccountUpdate],
        [EventsEnum.FRAUD_SUSPEND_ACCOUNT, accountNeedsPswReset, suspendAccountUpdate],
        [EventsEnum.AUTH_PASSWORD_RESET_SUCCESSFUL, accountNeedsPswReset, pswResetSuccessfulUpdateUnsuspended],
        [EventsEnum.FRAUD_FORCED_USER_IDENTITY_REVERIFICATION, accountNeedsPswReset, idResetRequiredUpdate],
        [
          EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_REVERIFICATION,
          accountNeedsPswReset,
          pswAndIdResetRequiredUpdate,
        ],
      ])('%p', (intervention, retrievedAccountState, command) => {
        const partialCommand = accountStateEngine.applyEventTransition(intervention, retrievedAccountState);
        expect(partialCommand).toEqual(command);
      });
    });

    describe('from suspended id reset required', () => {
      it.each([
        [
          EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_REVERIFICATION,
          accountNeedsIDReset,
          pswAndIdResetRequiredUpdate,
        ],
        [EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET, accountNeedsIDReset, passwordResetRequiredUpdate],
        [EventsEnum.FRAUD_SUSPEND_ACCOUNT, accountNeedsIDReset, suspendAccountUpdate],
        [EventsEnum.FRAUD_UNSUSPEND_ACCOUNT, accountNeedsIDReset, unsuspendAccountUpdate],
        [EventsEnum.IPV_IDENTITY_ISSUED, accountNeedsIDReset, idResetSuccessfulUpdateUnsuspended],
        [EventsEnum.FRAUD_BLOCK_ACCOUNT, accountNeedsIDReset, blockAccountUpdate],
      ])('%p', (intervention, retrievedAccountState, command) => {
        const partialCommand = accountStateEngine.applyEventTransition(intervention, retrievedAccountState);
        expect(partialCommand).toEqual(command);
      });
    });

    describe('from suspended psw & id reset required', () => {
      it.each([
        [EventsEnum.FRAUD_BLOCK_ACCOUNT, accountNeedsIDResetAdnPswReset, blockAccountUpdate],
        [EventsEnum.FRAUD_FORCED_USER_IDENTITY_REVERIFICATION, accountNeedsIDResetAdnPswReset, idResetRequiredUpdate],
        [EventsEnum.AUTH_PASSWORD_RESET_SUCCESSFUL, accountNeedsIDResetAdnPswReset, pswResetSuccessfulUpdateSuspended],
        [EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET, accountNeedsIDResetAdnPswReset, passwordResetRequiredUpdate],
        [EventsEnum.IPV_IDENTITY_ISSUED, accountNeedsIDResetAdnPswReset, idResetSuccessfulUpdateSuspended],
        [EventsEnum.FRAUD_UNSUSPEND_ACCOUNT, accountNeedsIDResetAdnPswReset, unsuspendAccountUpdate],
        [EventsEnum.FRAUD_SUSPEND_ACCOUNT, accountNeedsIDResetAdnPswReset, suspendAccountUpdate],
      ])('%p', (intervention, retrievedAccountState, command) => {
        const partialCommand = accountStateEngine.applyEventTransition(intervention, retrievedAccountState);
        expect(partialCommand).toEqual(command);
      });
    });

    describe('from blocked', () => {
      it.each([[EventsEnum.FRAUD_UNBLOCK_ACCOUNT, accountIsBlocked, unblockAccountUpdate]])(
        '%p',
        (intervention, retrievedAccountState, command) => {
          const partialCommand = accountStateEngine.applyEventTransition(intervention, retrievedAccountState);
          expect(partialCommand).toEqual(command);
        },
      );
    });
  });

  describe('Unsuccessful state transitions', () => {
    describe('received intervention is not allowed on current account state', () => {
      it.each([
        [EventsEnum.FRAUD_UNBLOCK_ACCOUNT, undefined],
        [EventsEnum.FRAUD_UNSUSPEND_ACCOUNT, undefined],
        [EventsEnum.AUTH_PASSWORD_RESET_SUCCESSFUL, undefined],
        [EventsEnum.IPV_IDENTITY_ISSUED, undefined],

        [EventsEnum.FRAUD_UNBLOCK_ACCOUNT, accountIsOkay],
        [EventsEnum.AUTH_PASSWORD_RESET_SUCCESSFUL, accountIsOkay],
        [EventsEnum.IPV_IDENTITY_ISSUED, accountIsOkay],

        [EventsEnum.FRAUD_UNBLOCK_ACCOUNT, accountIsSuspended],
        [EventsEnum.AUTH_PASSWORD_RESET_SUCCESSFUL, accountIsSuspended],
        [EventsEnum.IPV_IDENTITY_ISSUED, accountIsSuspended],

        [EventsEnum.FRAUD_UNBLOCK_ACCOUNT, accountNeedsPswReset],
        [EventsEnum.IPV_IDENTITY_ISSUED, accountNeedsPswReset],

        [EventsEnum.FRAUD_UNBLOCK_ACCOUNT, accountNeedsIDReset],
        [EventsEnum.AUTH_PASSWORD_RESET_SUCCESSFUL, accountNeedsIDReset],

        [EventsEnum.FRAUD_UNBLOCK_ACCOUNT, accountNeedsIDResetAdnPswReset],

        [EventsEnum.AUTH_PASSWORD_RESET_SUCCESSFUL, accountIsBlocked],
        [EventsEnum.IPV_IDENTITY_ISSUED, accountIsBlocked],
        [EventsEnum.FRAUD_UNSUSPEND_ACCOUNT, accountIsBlocked],
        [EventsEnum.FRAUD_SUSPEND_ACCOUNT, accountIsBlocked],
        [EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET, accountIsBlocked],
        [EventsEnum.FRAUD_FORCED_USER_IDENTITY_REVERIFICATION, accountIsBlocked],
        [EventsEnum.FRAUD_FORCED_USER_PASSWORD_RESET_AND_IDENTITY_REVERIFICATION, accountIsBlocked],
      ])('%p applied on account state: %p', (intervention, retrievedAccountState) => {
        expect(() => accountStateEngine.applyEventTransition(intervention, retrievedAccountState)).toThrow();
      });
    });
    describe('current state account could not be found in current config', () => {
      it('should throw if an unexpected account state is received', () => {
        const unexpectedAccountState = {
          blocked: true,
          suspended: true,
          reproveIdentity: true,
          resetPassword: true,
        };
        expect(() =>
          accountStateEngine.applyEventTransition(EventsEnum.FRAUD_BLOCK_ACCOUNT, unexpectedAccountState),
        ).toThrow(new StateTransitionError('Account state does not exists in current configuration.'));
        expect(logAndPublishMetric).toHaveBeenLastCalledWith(MetricNames.STATE_NOT_FOUND_IN_CURRENT_CONFIG);
      });
    });
  });

  describe('Configuration errors', () => {
    it('should throw when given code cannot be found in configuration', () => {
      expect(() => accountStateEngine.getInterventionEnumFromCode(111)).toThrow(new StateTransitionError('code: 111 is not found in current configuration'));
      expect(logAndPublishMetric).toHaveBeenLastCalledWith(MetricNames.NO_INTERVENTION_FOUND_FOR_THIS_CODE);
    })
    it('should throw when the computed state is the same as the current state', () => {
      const invalidConfig: TransitionConfigurationInterface = {
        nodes: {
          AccountIsOkay: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
          AccountIsBlocked: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
        },
        adjacency: {
          AccountIsOkay: [1],
        },
        edges: {
          1: {
            to: 'AccountIsBlocked',
            name: EventsEnum.FRAUD_BLOCK_ACCOUNT,
            interventionName: AISInterventionTypes.AIS_ACCOUNT_BLOCKED,
          }
        }
      }
      Object.defineProperty(AccountStateEngine, 'configuration', {
        writable: true,
        value: invalidConfig,
      });

      expect(() =>
        accountStateEngine.applyEventTransition(EventsEnum.FRAUD_BLOCK_ACCOUNT, accountIsOkay),
      ).toThrow(new StateTransitionError('Computed new state is the same as the current state.'));
      expect(logAndPublishMetric).toHaveBeenLastCalledWith(MetricNames.TRANSITION_SAME_AS_CURRENT_STATE);

    });
    it('should throw when there are no configured transition for a given state', () => {
      const invalidConfig: TransitionConfigurationInterface = {
        nodes: {
          AccountIsOkay: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
          AccountIsBlocked: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
        },
        adjacency: {
          AccountIsOkay: [1],
        },
        edges: {
          1: {
            to: 'AccountIsBlocked',
            name: EventsEnum.FRAUD_BLOCK_ACCOUNT,
            interventionName: AISInterventionTypes.AIS_ACCOUNT_BLOCKED,
          }
        }
      }
      Object.defineProperty(AccountStateEngine, 'configuration', {
        writable: true,
        value: invalidConfig,
      });

      expect(() =>
        accountStateEngine.applyEventTransition(EventsEnum.FRAUD_UNBLOCK_ACCOUNT, accountIsBlocked),
      ).toThrow(new StateTransitionError('There are no allowed transitions from state AccountIsBlocked in current configurations'));
      expect(logAndPublishMetric).toHaveBeenLastCalledWith(MetricNames.NO_TRANSITIONS_FOUND_IN_CONFIG);

    });
    it('should throw when the proposed transition points to a non-existing state in current config', () => {
      const invalidConfig: TransitionConfigurationInterface = {
        nodes: {
          AccountIsOkay: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
          AccountIsBlocked: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
        },
        adjacency: {
          AccountIsOkay: [1],
        },
        edges: {
          1: {
            to: 'AccountIsNotOkay',
            name: EventsEnum.FRAUD_BLOCK_ACCOUNT,
            interventionName: AISInterventionTypes.AIS_ACCOUNT_BLOCKED,
          }
        }
      }
      Object.defineProperty(AccountStateEngine, 'configuration', {
        writable: true,
        value: invalidConfig,
      });

      expect(() =>
        accountStateEngine.applyEventTransition(EventsEnum.FRAUD_BLOCK_ACCOUNT, accountIsOkay),
      ).toThrow(new StateTransitionError('state AccountIsNotOkay not found in current config.'));
      expect(logAndPublishMetric).toHaveBeenLastCalledWith(MetricNames.STATE_NOT_FOUND_IN_CURRENT_CONFIG);

    });
    it('should throw when the the configuration object fails validation because not all nodes have an adjacency list', () => {
      const invalidConfig: TransitionConfigurationInterface = {
        nodes: {
          AccountIsOkay: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
          AccountIsBlocked: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
        },
        adjacency: {
          AccountIsOkay: [1],
        },
        edges: {
          1: {
            to: 'AccountIsOkay',
            name: EventsEnum.FRAUD_BLOCK_ACCOUNT,
            interventionName: AISInterventionTypes.AIS_ACCOUNT_BLOCKED,
          }
        }
      }
      Object.defineProperty(AccountStateEngine, 'instance', {
        writable: true,
        value: undefined,
      });
      Object.defineProperty(AccountStateEngine, 'configuration', {
        writable: true,
        value: invalidConfig,
      });

      expect(() =>
        AccountStateEngine.getInstance()
      ).toThrow(new StateTransitionError('Invalid state engine configuration detected.'));
      expect(logAndPublishMetric).toHaveBeenLastCalledWith(MetricNames.INVALID_STATE_ENGINE_CONFIGURATION);
    });
    it('should throw when the the configuration object fails validation because at least one edge points to a non-existing node', () => {
      const invalidConfig: TransitionConfigurationInterface = {
        nodes: {
          AccountIsOkay: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
          AccountIsBlocked: {
            blocked: false,
            suspended: false,
            resetPassword: false,
            reproveIdentity: false,
          },
        },
        adjacency: {
          AccountIsOkay: [1],
          AccountIsBlocked: [1]
        },
        edges: {
          1: {
            to: 'AccountIsNotOkay',
            name: EventsEnum.FRAUD_BLOCK_ACCOUNT,
            interventionName: AISInterventionTypes.AIS_ACCOUNT_BLOCKED,
          }
        }
      }
      Object.defineProperty(AccountStateEngine, 'instance', {
        writable: true,
        value: undefined,
      });
      Object.defineProperty(AccountStateEngine, 'configuration', {
        writable: true,
        value: invalidConfig,
      });

      expect(() =>
        AccountStateEngine.getInstance()
      ).toThrow(new StateTransitionError('Invalid state engine configuration detected.'));
      expect(logAndPublishMetric).toHaveBeenLastCalledWith(MetricNames.INVALID_STATE_ENGINE_CONFIGURATION);
    });
  });
});
