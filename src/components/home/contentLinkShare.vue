<template>
	<div
		:class="[background ? 'has-background' : '', $route.name+'-view']"
		:style="{'background-image': `url(${background})`}"
		class="link-share-container"
	>
		<div class="container has-text-centered link-share-view">
			<div class="column is-10 is-offset-1">
				<img alt="Vikunja" class="logo" :src="logoUrl" />
				<h1
					:style="{ 'opacity': currentList.title === '' ? '0': '1' }"
					class="title">
					{{ currentList.title === '' ? $t('misc.loading') : currentList.title }}
				</h1>
				<div class="box has-text-left view">
					<router-view/>
					<a class="menu-bottom-link" href="https://vikunja.io" target="_blank" rel="noreferrer noopener nofollow">
						{{ $t('misc.poweredBy') }}
					</a>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import {mapState} from 'vuex'
import {CURRENT_LIST} from '@/store/mutation-types'

import logoUrl from '@/assets/logo-full.svg'

export default {
	name: 'contentLinkShare',
	data() {
		return {
			logoUrl,
		}
	},
	computed: mapState({
		currentList: CURRENT_LIST,
		background: 'background',
	}),
	methods: {
		logout() {
			this.$store.dispatch('auth/logout')
			this.$router.push({name: 'user.login'})
		},
	},
}
</script>
