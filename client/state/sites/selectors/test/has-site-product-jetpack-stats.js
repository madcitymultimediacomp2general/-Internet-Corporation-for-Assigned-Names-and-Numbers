import hasSiteProductJetpackStats from 'calypso/state/sites/selectors/has-site-product-jetpack-stats';

describe( 'hasSiteProductJetpackStats()', () => {
	test( 'should return false if site has only free products and set to onlyPaid', () => {
		const stateWithFreeStats = {
			sites: {
				items: {
					2916288: {
						plan: {},
						products: [
							{
								product_slug: 'jetpack_stats_free_yearly',
								expired: false,
							},
						],
					},
				},
			},
		};
		const hasPaidJetpackStats = hasSiteProductJetpackStats( stateWithFreeStats, true, 2916288 );

		expect( hasPaidJetpackStats ).toEqual( false );
	} );

	test( 'should return true if site has free products and set not onlyPaid', () => {
		const stateWithFreeStats = {
			sites: {
				items: {
					2916288: {
						plan: {},
						products: [
							{
								product_slug: 'jetpack_stats_free_yearly',
								expired: false,
							},
						],
					},
				},
			},
		};
		const hasJetpackStats = hasSiteProductJetpackStats( stateWithFreeStats, false, 2916288 );

		expect( hasJetpackStats ).toEqual( true );
	} );

	test( 'should return true if site has paid products and set to onlyPaid', () => {
		const stateWithPaidStats = {
			sites: {
				items: {
					2916288: {
						plan: {},
						products: [
							{
								product_slug: 'jetpack_stats_monthly',
								expired: false,
							},
						],
					},
				},
			},
		};
		const hasPaidJetpackStats = hasSiteProductJetpackStats( stateWithPaidStats, true, 2916288 );

		expect( hasPaidJetpackStats ).toEqual( true );
	} );

	test( 'should return false if site has paid products but expired', () => {
		const stateWithExpiredStats = {
			sites: {
				items: {
					2916288: {
						plan: {},
						products: [
							{
								product_slug: 'jetpack_stats_monthly',
								expired: true,
							},
						],
					},
				},
			},
		};
		const hasJetpackStats = hasSiteProductJetpackStats( stateWithExpiredStats, false, 2916288 );

		expect( hasJetpackStats ).toEqual( false );
	} );
} );
