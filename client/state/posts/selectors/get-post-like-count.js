import { get } from 'lodash';

import 'calypso/state/posts/init';

/**
 * Returns the count of post likes for a given site ID, post ID.
 *
 * @param  {Object}  state  Global state tree
 * @param  {number}  siteId Site ID
 * @param  {number}  postId Post ID
 * @returns {Array}          Post Likes
 */
export function getPostLikeCount( state, siteId, postId ) {
	return get( state.posts.likes.items, [ siteId, postId, 'found' ], 0 );
}
