import { get } from 'lodash';

import 'calypso/state/activity-log/init';

/**
 * Indicates whether the Rewind feature is currently being
 * activated or deactivated.
 *
 * @param {Object} state Global state tree
 * @param {number|string} siteId the site ID
 * @returns {boolean} true is rewind is currently activating/deactivating
 */
export default function isRewindActivating( state, siteId ) {
	return !! get( state.activityLog.activationRequesting, siteId, false );
}
