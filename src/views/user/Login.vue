<template>
	<div>
		<h2 class="title has-text-centered">Login</h2>
		<div class="box">
			<div class="notification is-success has-text-centered" v-if="confirmedEmailSuccess">
				{{ $t('user.auth.confirmEmailSuccess') }}
			</div>
			<api-config @foundApi="hasApiUrl = true"/>
			<form @submit.prevent="submit" id="loginform" v-if="hasApiUrl && localAuthEnabled">
				<div class="field">
					<label class="label" for="username">{{ $t('user.auth.usernameEmail') }}</label>
					<div class="control">
						<input
							class="input" id="username"
							name="username"
							:placeholder="$t('user.auth.usernamePlaceholder')"
							ref="username"
							required
							type="text"
							autocomplete="username"
							v-focus
							@keyup.enter="submit"
						/>
					</div>
				</div>
				<div class="field">
					<label class="label" for="password">{{ $t('user.auth.password') }}</label>
					<div class="control">
						<input
							class="input"
							id="password"
							name="password"
							:placeholder="$t('user.auth.passwordPlaceholder')"
							ref="password"
							required
							type="password"
							autocomplete="current-password"
							@keyup.enter="submit"
						/>
					</div>
				</div>
				<div class="field" v-if="needsTotpPasscode">
					<label class="label" for="totpPasscode">{{ $t('user.auth.totpTitle') }}</label>
					<div class="control">
						<input
							class="input"
							id="totpPasscode"
							:placeholder="$t('user.auth.totpPlaceholder')"
							ref="totpPasscode"
							required
							type="text"
							v-focus
							@keyup.enter="submit"
						/>
					</div>
				</div>

				<div class="field is-grouped login-buttons">
					<div class="control is-expanded">
						<x-button
							@click="submit"
							:loading="loading"
						>
							{{ $t('user.auth.login') }}
						</x-button>
						<x-button
							:to="{ name: 'user.register' }"
							v-if="registrationEnabled"
							type="secondary"
						>
							{{ $t('user.auth.register') }}
						</x-button>
					</div>
					<div class="control">
						<router-link :to="{ name: 'user.password-reset.request' }" class="reset-password-link">
							{{ $t('user.auth.resetPassword') }}
						</router-link>
					</div>
				</div>
				<div class="notification is-danger" v-if="errorMessage">
					{{ errorMessage }}
				</div>
			</form>

			<div
				v-if="hasOpenIdProviders"
				class="mt-4">
				<x-button
					@click="redirectToProvider(p)"
					v-for="(p, k) in openidConnect.providers"
					:key="k"
					type="secondary"
					class="is-fullwidth mt-2"
				>
					{{ $t('user.auth.loginWith', {provider: p.name}) }}
				</x-button>
			</div>

			<legal/>
		</div>
	</div>
</template>

<script>
import {mapState} from 'vuex'

import {HTTPFactory} from '@/http-common'
import {ERROR_MESSAGE, LOADING} from '@/store/mutation-types'
import legal from '../../components/misc/legal'
import ApiConfig from '@/components/misc/api-config.vue'
import {getErrorText} from '@/message'
import {redirectToProvider} from '../../helpers/redirectToProvider'
import {getLastVisited, clearLastVisited} from '../../helpers/saveLastVisited'

export default {
	components: {
		ApiConfig,
		legal,
	},
	data() {
		return {
			confirmedEmailSuccess: false,
			hasApiUrl: false,
		}
	},
	beforeMount() {
		const HTTP = HTTPFactory()
		// Try to verify the email
		// FIXME: Why is this here? Can we find a better place for this?
		let emailVerifyToken = localStorage.getItem('emailConfirmToken')
		if (emailVerifyToken) {
			const cancel = this.setLoading()
			HTTP.post('user/confirm', {token: emailVerifyToken})
				.then(() => {
					localStorage.removeItem('emailConfirmToken')
					this.confirmedEmailSuccess = true
					cancel()
				})
				.catch(e => {
					cancel()
					this.$store.commit(ERROR_MESSAGE, e.response.data.message)
				})
		}

		// Check if the user is already logged in, if so, redirect them to the homepage
		if (this.authenticated) {
			const last = getLastVisited()
			if (last !== null) {
				this.$router.push({
					name: last.name, 
					params: last.params,
				})
				clearLastVisited()
			} else {
				this.$router.push({name: 'home'})
			}
		}
	},
	created() {
		this.hasApiUrl = window.API_URL !== ''
		this.setTitle(this.$t('user.auth.login'))
	},
	computed: {
		hasOpenIdProviders() {
			return this.hasApiUrl &&
				this.openidConnect.enabled &&
				this.openidConnect.providers &&
				this.openidConnect.providers.length > 0
		},
		...mapState({
			registrationEnabled: state => state.config.registrationEnabled,
			loading: LOADING,
			errorMessage: ERROR_MESSAGE,
			needsTotpPasscode: state => state.auth.needsTotpPasscode,
			authenticated: state => state.auth.authenticated,
			localAuthEnabled: state => state.config.auth.local.enabled,
			openidConnect: state => state.config.auth.openidConnect,
		}),
	},
	methods: {
		setLoading() {
			const timeout = setTimeout(() => {
				this.loading = true
			}, 100)
			return () => {
				clearTimeout(timeout)
				this.loading = false
			}
		},
		submit() {
			this.$store.commit(ERROR_MESSAGE, '')
			// Some browsers prevent Vue bindings from working with autofilled values.
			// To work around this, we're manually getting the values here instead of relying on vue bindings.
			// For more info, see https://kolaente.dev/vikunja/frontend/issues/78
			const credentials = {
				username: this.$refs.username.value,
				password: this.$refs.password.value,
			}

			if (this.needsTotpPasscode) {
				credentials.totpPasscode = this.$refs.totpPasscode.value
			}

			this.$store.dispatch('auth/login', credentials)
				.then(() => {
					this.$store.commit('auth/needsTotpPasscode', false)
				})
				.catch(e => {
					if (e.response && e.response.data.code === 1017 && !credentials.totpPasscode) {
						return
					}

					const err = getErrorText(e, p => this.$t(p))
					if (typeof err[1] !== 'undefined') {
						this.$store.commit(ERROR_MESSAGE, err[1])
						return
					}

					this.$store.commit(ERROR_MESSAGE, err[0])
				})
		},
		redirectToProvider(provider) {
			redirectToProvider(provider, this.openidConnect.redirectUrl)
		},
	},
}
</script>

<style scoped>
.button {
	margin: 0 0.4rem 0 0;
}

.reset-password-link {
	display: inline-block;
	padding-top: 5px;
}
</style>
