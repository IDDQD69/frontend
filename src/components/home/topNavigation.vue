<template>
	<nav
		:class="{'has-background': background}"
		aria-label="main navigation"
		class="navbar main-theme is-fixed-top"
		role="navigation"
	>
		<div class="navbar-brand">
			<router-link :to="{name: 'home'}" class="navbar-item logo">
				<img width="164" height="48" alt="Vikunja" :src="logoUrl" />
			</router-link>
			<a
				@click="$store.commit('toggleMenu')"
				class="menu-show-button"
				@shortkey="() => $store.commit('toggleMenu')"
				v-shortkey="['ctrl', 'e']"
			>
			</a>
		</div>
		<a
			@click="$store.commit('toggleMenu')"
			class="menu-show-button"
		>
		</a>
		<div class="list-title" ref="listTitle" :style="{'display': currentList.id ? '': 'none'}">
			<template v-if="currentList.id">
				<h1
					:style="{ 'opacity': currentList.title === '' ? '0': '1' }"
					class="title">
					{{ currentList.title === '' ? $t('misc.loading') : getListTitle(currentList) }}
				</h1>

				<list-settings-dropdown v-if="canWriteCurrentList && currentList.id !== -1" :list="currentList"/>
			</template>
		</div>

		<div class="navbar-end">
			<update/>
			<a
				@click="openQuickActions"
				class="trigger-button pr-0"
				@shortkey="openQuickActions"
				v-shortkey="['ctrl', 'k']"
			>
				<icon icon="search"/>
			</a>
			<notifications/>
			<div class="user">
				<img :src="userAvatar" alt="" class="avatar" width="40" height="40"/>
				<dropdown class="is-right" ref="usernameDropdown">
					<template #trigger>
						<x-button
							type="secondary"
							:shadow="false">
							<span class="username">{{ userInfo.name !== '' ? userInfo.name : userInfo.username }}</span>
							<span class="icon is-small">
								<icon icon="chevron-down"/>
							</span>
						</x-button>
					</template>

					<router-link :to="{name: 'user.settings'}" class="dropdown-item">
						{{ $t('user.settings.title') }}
					</router-link>
					<a
						:href="imprintUrl"
						class="dropdown-item"
						target="_blank"
						rel="noreferrer noopener nofollow"
						v-if="imprintUrl">
						{{ $t('navigation.imprint') }}
					</a>
					<a
						:href="privacyPolicyUrl"
						class="dropdown-item"
						target="_blank"
						rel="noreferrer noopener nofollow"
						v-if="privacyPolicyUrl">
						{{ $t('navigation.privacy') }}
					</a>
					<a @click="$store.commit('keyboardShortcutsActive', true)" class="dropdown-item">
						{{ $t('keyboardShortcuts.title') }}
					</a>
					<router-link :to="{name: 'about'}" class="dropdown-item">
						{{ $t('about.title') }}
					</router-link>
					<a @click="logout()" class="dropdown-item">
						{{ $t('user.auth.logout') }}
					</a>
				</dropdown>
			</div>
		</div>
	</nav>
</template>

<script>
import {mapState} from 'vuex'
import {CURRENT_LIST, QUICK_ACTIONS_ACTIVE} from '@/store/mutation-types'
import Rights from '@/models/constants/rights.json'
import Update from '@/components/home/update.vue'
import ListSettingsDropdown from '@/components/list/list-settings-dropdown.vue'
import Dropdown from '@/components/misc/dropdown.vue'
import Notifications from '@/components/notifications/notifications.vue'

import logoUrl from '@/assets/logo-full.svg'
import logoFullPrideUrl from '@/assets/logo-full-pride.svg'

export default {
	name: 'topNavigation',
	components: {
		Notifications,
		Dropdown,
		ListSettingsDropdown,
		Update,
	},
	computed: {
		logoUrl() {
			return (new Date()).getMonth() === 5 ? logoFullPrideUrl : logoUrl
		},
		...mapState({
			userInfo: state => state.auth.info,
			userAvatar: state => state.auth.avatarUrl,
			userAuthenticated: state => state.auth.authenticated,
			currentList: CURRENT_LIST,
			background: 'background',
			imprintUrl: state => state.config.legal.imprintUrl,
			privacyPolicyUrl: state => state.config.legal.privacyPolicyUrl,
			canWriteCurrentList: state => state.currentList.maxRight > Rights.READ,
		}),
	},
	mounted() {
		this.$nextTick(() => {
			if (typeof this.$refs.usernameDropdown === 'undefined' || typeof this.$refs.listTitle === 'undefined') {
				return
			}

			const usernameWidth = this.$refs.usernameDropdown.$el.clientWidth
			this.$refs.listTitle.style.setProperty('--nav-username-width', `${usernameWidth}px`)
		})
	},
	methods: {
		logout() {
			this.$store.dispatch('auth/logout')
			this.$router.push({name: 'user.login'})
		},
		openQuickActions() {
			this.$store.commit(QUICK_ACTIONS_ACTIVE, true)
		},
	},
}
</script>
