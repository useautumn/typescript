import {FreeTrial} from '../../compose/models/planModels.js';

export function freeTrialBuilder({freeTrial}: {freeTrial: FreeTrial}) {
	return `free_trial: {
		duration_type: '${freeTrial.duration_type}',
		duration_length: ${freeTrial.duration_length},
		card_required: ${freeTrial.card_required},
	},`;
}
