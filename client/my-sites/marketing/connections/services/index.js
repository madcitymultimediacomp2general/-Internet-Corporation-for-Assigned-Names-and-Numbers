export { default as instagram_basic_display } from './instagram';
export { default as google_photos } from './google-photos';
export { default as google_drive } from './google-drive';
export { default as google_my_business } from './google-my-business';
export { default as facebook } from './facebook';
export { default as instagram_business } from './instagram-business';
export { default as mastodon } from './mastodon';
export { default as mailchimp } from './mailchimp';
export { default as p2_slack } from './p2-slack';
export { default as p2_github } from './p2-github';

const services = new Set( [
	'p2_github',
	'p2_slack',
	'facebook',
	'instagram_business',
	'mastodon',
	'instagram_basic_display',
	'google_photos',
	'google_drive',
	'google_my_business',
	'mailchimp',
] );
export const hasOwnProperty = ( name ) => services.has( name );
