<template>
	<div class="no-auth-wrapper">
		<div class="noauth-container">
			<img alt="Vikunja" :src="logoUrl" width="400" height="117" />
			<div class="message is-info" v-if="motd !== ''">
				<div class="message-header">
					<p>{{ $t('misc.info') }}</p>
				</div>
				<div class="message-body">
					{{ motd }}
				</div>
			</div>
			<router-view/>
		</div>
	</div>
</template>

<script>
import {mapState} from 'vuex'

import logoUrl from '@/assets/logo-full.svg'
import { saveLastVisited } from '@/helpers/saveLastVisited'

export default {
	name: 'contentNoAuth',
	data() {
		return {
			logoUrl,	
		}
	},
	created() {
		this.redirectToHome()
	},
	computed: mapState({
		motd: state => state.config.motd,
	}),
	methods: {
		redirectToHome() {
			// Check if the user is already logged in and redirect them to the home page if not
			if (
				this.$route.name !== 'user.login' &&
				this.$route.name !== 'user.password-reset.request' &&
				this.$route.name !== 'user.password-reset.reset' &&
				this.$route.name !== 'user.register' &&
				this.$route.name !== 'link-share.auth' &&
				this.$route.name !== 'openid.auth' &&
				localStorage.getItem('passwordResetToken') === null &&
				localStorage.getItem('emailConfirmToken') === null
			) {
				saveLastVisited(this.$route.name, this.$route.params)
				this.$router.push({name: 'user.login'})
			}
		},
	},
}
</script>
