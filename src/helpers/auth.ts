import {HTTPFactory} from '@/http-common'
import {AxiosResponse} from 'axios'

let savedToken: string | null = null

/**
 * Saves a token while optionally saving it to lacal storage. This is used when viewing a link share:
 * It enables viewing multiple link shares indipendently from each in multiple tabs other without overriding any other open ones.
 * @param token
 * @param persist
 */
export const saveToken = (token: string, persist: boolean) => {
	savedToken = token
	if (persist) {
		localStorage.setItem('token', token)
	}
}

/**
 * Returns a saved token. If there is one saved in memory it will use that before anything else.
 * @returns {string|null}
 */
export const getToken = (): string | null => {
	if (savedToken !== null) {
		return savedToken
	}

	savedToken = localStorage.getItem('token')
	return savedToken
}

/**
 * Removes all tokens everywhere.
 */
export const removeToken = () => {
	savedToken = null
	localStorage.removeItem('token')
}

/**
 * Refreshes an auth token while ensuring it is updated everywhere.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const refreshToken = (persist: boolean): Promise<AxiosResponse> => {
	const HTTP = HTTPFactory()
	return HTTP.post('user/token', null, {
		headers: {
			Authorization: `Bearer ${getToken()}`,
		},
	})
		.then(r => {
			saveToken(r.data.token, persist)
			return Promise.resolve(r)
		})
		.catch(e => {
			// eslint-disable-next-line
			console.log('Error renewing token: ', e)
			return Promise.reject(e)
		})
}

