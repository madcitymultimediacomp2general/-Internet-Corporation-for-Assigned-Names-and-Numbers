import { Icon, chartBar } from '@wordpress/icons';
import { useTranslate } from 'i18n-calypso';
import { useSubscriberStatsRate } from '../../hooks';
import { useSubscriberStatsQuery } from '../../queries';
import { SubscriberStatsCard } from '../subscriber-stats-card';
import { MailIcon, SelectIcon } from './icons';
import './style.scss';

type SubscriberStatsProps = {
	siteId: number;
	subscriptionId?: number;
	userId?: number;
};

const SubscriberStats = ( { siteId, subscriptionId, userId }: SubscriberStatsProps ) => {
	const translate = useTranslate();

	const { data: subscriberStats, isLoading } = useSubscriberStatsQuery(
		siteId,
		subscriptionId,
		userId
	);

	const openRate = useSubscriberStatsRate( subscriberStats, 'unique_opens' );
	const clickRate = useSubscriberStatsRate( subscriberStats, 'unique_clicks' );

	return (
		<div className="subscriber-stats highlight-cards-list">
			<SubscriberStatsCard
				heading="Emails sent"
				isLoading={ isLoading }
				icon={ <Icon icon={ MailIcon } /> }
				helpText={ translate( 'Total number of emails sent to this subscriber.' ) }
				value={ subscriberStats?.emails_sent }
			/>
			<SubscriberStatsCard
				heading="Open rate"
				isLoading={ isLoading }
				icon={ <Icon icon={ chartBar } /> }
				value={ `${ openRate }%` }
			/>
			<SubscriberStatsCard
				heading="Click rate"
				icon={ <Icon icon={ SelectIcon } /> }
				isLoading={ isLoading }
				value={ `${ clickRate }%` }
			/>
		</div>
	);
};

export default SubscriberStats;
