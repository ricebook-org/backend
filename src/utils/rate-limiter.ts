import { createClient } from "redis";

const client = createClient();
const prefix = "RICEBOOK_";

export const RateLimiter = {
	connect: async () => {
		client.on("error", (err) => {
			throw Error(`Unable to connect to Redis server: ${err}`);
		});
		await client.connect();
	},
	/**
	 * Rate limits an action, increases usage by 1 everytime this function is called
	 * @param action unique code for action
	 * @param limit number of times the action can be performed in ttl seconds
	 * @param ttl time frame for action count to expire
	 * @returns true if allowed to proceed, remaining ttl if not allowed to proceed
	 */
	canPerformAction: async (
		action: string,
		limit: number,
		ttl: number
	): Promise<true | number> => {
		const fAction = prefix + action;
		const initial = await client.get(fAction);

		// if action does not exist, set it's value to 1
		// since it was just performed 1 time and allow
		// the action by returning true.
		if (!initial) {
			client.set(fAction, 1, {
				// expiry in seconds
				EX: ttl,
			});

			return true;
		} else {
			// if the action exists, see if it's less than
			// limit -- if it is, incr the value and allow
			// otherwise, reject the action by ret. false
			if (parseInt(initial) < limit) {
				client.incr(fAction);
				return true;
			} else return await client.ttl(fAction);
		}
	},
};
