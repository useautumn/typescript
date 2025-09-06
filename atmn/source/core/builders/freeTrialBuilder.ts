import {FreeTrial} from '../../compose/models/composeModels.js';

export function freeTrialBuilder({freeTrial}: {freeTrial: FreeTrial}) {
	return `free_trial: {
		duration: '${freeTrial.duration}',
		length: ${freeTrial.length},
		unique_fingerprint: ${freeTrial.unique_fingerprint},
		card_required: ${freeTrial.card_required},
	},`;
}
