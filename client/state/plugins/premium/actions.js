import { get, keys } from 'lodash';
import { INSTALL_PLUGIN } from 'calypso/lib/plugins/constants';
import versionCompare from 'calypso/lib/version-compare';
import wpcom from 'calypso/lib/wp';
import {
	PLUGIN_INSTALL_REQUEST,
	PLUGIN_INSTALL_REQUEST_FAILURE,
	PLUGIN_INSTALL_REQUEST_SUCCESS,
	PLUGIN_SETUP_INSTRUCTIONS_FETCH,
	PLUGIN_SETUP_INSTRUCTIONS_RECEIVE,
	PLUGIN_SETUP_INSTALL,
	PLUGIN_SETUP_ACTIVATE,
	PLUGIN_SETUP_CONFIGURE,
	PLUGIN_SETUP_FINISH,
	PLUGIN_SETUP_ERROR,
} from 'calypso/state/action-types';

import 'calypso/state/plugins/init';

/**
 *  Local variables;
 */
const _fetching = {};

const normalizePluginInstructions = ( data ) => {
	const _plugins = data.keys;
	return keys( _plugins ).map( ( slug ) => {
		const apiKey = _plugins[ slug ];
		return {
			slug: slug,
			name: slug,
			key: apiKey,
			status: 'wait',
			error: null,
		};
	} );
};

/**
 * Return a SitePlugin instance used to handle the plugin
 *
 * @param {Object} site - site object
 * @param {string} plugin - plugin identifier
 * @returns {any} SitePlugin instance
 */
const getPluginHandler = ( site, plugin ) => {
	const siteHandler = wpcom.site( site.ID );
	const pluginHandler = siteHandler.plugin( plugin );
	return pluginHandler;
};

function install( site, plugin, dispatch ) {
	dispatch( {
		type: PLUGIN_INSTALL_REQUEST,
		action: INSTALL_PLUGIN,
		siteId: site.ID,
		pluginId: plugin.id,
	} );

	if ( plugin.active ) {
		dispatch( {
			type: PLUGIN_SETUP_CONFIGURE,
			siteId: site.ID,
			slug: plugin.slug,
		} );
		configure( site, plugin, dispatch );
		return;
	}

	getPluginHandler( site, plugin.slug )
		.install()
		.then( ( data ) => {
			dispatch( {
				type: PLUGIN_INSTALL_REQUEST_SUCCESS,
				action: INSTALL_PLUGIN,
				siteId: site.ID,
				pluginId: plugin.id,
				data,
			} );
			dispatch( {
				type: PLUGIN_SETUP_ACTIVATE,
				siteId: site.ID,
				slug: plugin.slug,
			} );

			data.key = plugin.key;
			activate( site, data, dispatch );
		} )
		.catch( ( error ) => {
			if ( error.name === 'PluginAlreadyInstalledError' ) {
				update( site, plugin, dispatch );
			} else {
				dispatch( {
					type: PLUGIN_SETUP_ERROR,
					siteId: site.ID,
					slug: plugin.slug,
					error,
				} );
				dispatch( {
					type: PLUGIN_INSTALL_REQUEST_FAILURE,
					action: INSTALL_PLUGIN,
					siteId: site.ID,
					pluginId: plugin.id,
					error,
				} );
			}
		} );
}

function update( site, plugin, dispatch ) {
	getPluginHandler( site, plugin.id )
		.updateVersion()
		.then( ( data ) => {
			dispatch( {
				type: PLUGIN_SETUP_ACTIVATE,
				siteId: site.ID,
				slug: plugin.slug,
			} );

			data.key = plugin.key;
			activate( site, data, dispatch );
		} )
		.catch( ( error ) => {
			dispatch( {
				type: PLUGIN_SETUP_ERROR,
				siteId: site.ID,
				slug: plugin.slug,
				error,
			} );
			dispatch( {
				type: PLUGIN_INSTALL_REQUEST_FAILURE,
				action: INSTALL_PLUGIN,
				siteId: site.ID,
				pluginId: plugin.id,
				error,
			} );
		} );
}

function activate( site, plugin, dispatch ) {
	const success = ( data ) => {
		dispatch( {
			type: PLUGIN_SETUP_CONFIGURE,
			siteId: site.ID,
			slug: data.slug,
		} );
		dispatch( {
			type: PLUGIN_INSTALL_REQUEST_SUCCESS,
			action: INSTALL_PLUGIN,
			siteId: site.ID,
			pluginId: plugin.id,
			data,
		} );

		autoupdate( site, data );
		configure( site, plugin, dispatch );
	};

	getPluginHandler( site, plugin.id )
		.activate()
		.then( success )
		.catch( ( error ) => {
			if ( error.name === 'ActivationErrorError' || error.name === 'ActivationError' ) {
				// Technically it failed, but only because it's already active.
				success( plugin );
				return;
			}
			dispatch( {
				type: PLUGIN_SETUP_ERROR,
				siteId: site.ID,
				slug: plugin.slug,
				error,
			} );
			dispatch( {
				type: PLUGIN_INSTALL_REQUEST_FAILURE,
				action: INSTALL_PLUGIN,
				siteId: site.ID,
				pluginId: plugin.id,
				error,
			} );
		} );
}

function autoupdate( site, plugin ) {
	getPluginHandler( site, plugin.id ).enableAutoupdate();
}

function configure( site, plugin, dispatch ) {
	let option = false;
	switch ( plugin.slug ) {
		case 'vaultpress':
			option = 'vaultpress_auto_register';
			break;
		case 'akismet':
			option = 'wordpress_api_key';
			break;
	}
	if ( ! option || ! plugin.key ) {
		const optionError = new Error( "We can't configure this plugin." );
		optionError.name = 'ConfigError';
		dispatch( {
			type: PLUGIN_SETUP_ERROR,
			siteId: site.ID,
			slug: plugin.slug,
			error: optionError,
		} );
		return;
	}
	let optionValue = plugin.key;
	// VP 1.8.4+ expects a different format for this option.
	if ( 'vaultpress' === plugin.slug && versionCompare( plugin.version, '1.8.3', '>' ) ) {
		optionValue = JSON.stringify( {
			key: plugin.key,
			action: 'register',
		} );
	}

	const saveOption = () => {
		return wpcom.req.post(
			`/sites/${ site.ID }/option`,
			{ option_name: option },
			{ option_value: optionValue },
			( error, data ) => {
				if (
					! error &&
					'vaultpress' === plugin.slug &&
					versionCompare( plugin.version, '1.8.3', '>' )
				) {
					const response = JSON.parse( data.option_value );
					if ( 'response' === response.action && 'broken' === response.status ) {
						error = new Error( response.error );
						error.name = 'RegisterError';
					}
				}
				if ( error ) {
					dispatch( {
						type: PLUGIN_SETUP_ERROR,
						siteId: site.ID,
						slug: plugin.slug,
						error,
					} );
				}
				dispatch( {
					type: PLUGIN_SETUP_FINISH,
					siteId: site.ID,
					slug: plugin.slug,
				} );
			}
		);
	};

	// We don't need to check for VaultPress
	if ( 'vaultpress' === plugin.slug ) {
		return saveOption();
	}

	return wpcom.req.get(
		`/sites/${ site.ID }/option`,
		{ option_name: option },
		( getError, getData ) => {
			if ( get( getData, 'option_value' ) === optionValue ) {
				// Already registered with this key
				dispatch( {
					type: PLUGIN_SETUP_FINISH,
					siteId: site.ID,
					slug: plugin.slug,
				} );
				return;
			} else if ( getData.option_value ) {
				// Already registered with another key
				const alreadyRegistered = new Error();
				alreadyRegistered.code = 'already_registered';
				dispatch( {
					type: PLUGIN_SETUP_ERROR,
					siteId: site.ID,
					slug: plugin.slug,
					error: alreadyRegistered,
				} );
				return;
			}
			return saveOption();
		}
	);
}

export function fetchInstallInstructions( siteId ) {
	return ( dispatch ) => {
		if ( _fetching[ siteId ] ) {
			return;
		}
		_fetching[ siteId ] = true;

		setTimeout( () => {
			dispatch( {
				type: PLUGIN_SETUP_INSTRUCTIONS_FETCH,
				siteId,
			} );
		}, 1 );

		wpcom.req
			.get( `/jetpack-blogs/${ siteId }/keys` )
			.then( ( data ) => {
				dispatch( {
					type: PLUGIN_SETUP_INSTRUCTIONS_RECEIVE,
					siteId,
					data: normalizePluginInstructions( data ),
				} );
			} )
			.catch( () => {
				dispatch( {
					type: PLUGIN_SETUP_INSTRUCTIONS_RECEIVE,
					siteId,
					data: [],
				} );
			} );
	};
}

export function installPlugin( plugin, site ) {
	return ( dispatch ) => {
		// Starting Install
		dispatch( {
			type: PLUGIN_SETUP_INSTALL,
			siteId: site.ID,
			slug: plugin.slug,
		} );

		install( site, plugin, dispatch );
	};
}
