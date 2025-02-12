import { loadScript } from '@automattic/load-script';
import { mayWeInitTracker } from '../tracker-buckets';
import { PARSLEY_SCRIPT_URL } from './constants';

/**
 * We'll be accessing PARSELY from the window object.
 */
declare global {
	interface Window {
		PARSELY: {
			conversions: {
				trackPurchase: ( label: string ) => void;
			};
		};
	}
}

/**
 * Loads the Parsely script, if the user has consented to tracking,
 * and tracking is allowed by the current environment.
 *
 * @returns Promise<void>
 */
export const loadParselyTracker = async (): Promise< void > => {
	// Are we allowed to track (user consent, e2e, etc.)?
	if ( ! mayWeInitTracker( 'parsely' ) ) {
		throw new Error( 'Tracking is not allowed' );
	}

	// Load the Parsely Tracker script
	await loadScript( PARSLEY_SCRIPT_URL );
};
