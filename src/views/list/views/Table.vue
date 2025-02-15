<template>
	<div :class="{'is-loading': taskCollectionService.loading}" class="table-view loader-container">
		<div class="filter-container">
			<div class="items">
				<x-button
					@click.prevent.stop="() => {showActiveColumnsFilter = !showActiveColumnsFilter; showTaskFilter = false}"
					icon="th"
					type="secondary"
				>
					{{ $t('list.table.columns') }}
				</x-button>
				<x-button
					@click.prevent.stop="() => {showTaskFilter = !showTaskFilter; showActiveColumnsFilter = false}"
					icon="filter"
					type="secondary"
				>
					{{ $t('filters.title') }}
				</x-button>
			</div>
			<transition name="fade">
				<card v-if="showActiveColumnsFilter">
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.id">#</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.done">
						{{ $t('task.attributes.done') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.title">
						{{ $t('task.attributes.title') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.priority">
						{{ $t('task.attributes.priority') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.labels">
						{{ $t('task.attributes.labels') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.assignees">
						{{ $t('task.attributes.assignees') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.dueDate">
						{{ $t('task.attributes.dueDate') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.startDate">
						{{ $t('task.attributes.startDate') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.endDate">
						{{ $t('task.attributes.endDate') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.percentDone">
						{{ $t('task.attributes.percentDone') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.created">
						{{ $t('task.attributes.created') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.updated">
						{{ $t('task.attributes.updated') }}
					</fancycheckbox>
					<fancycheckbox @change="saveTaskColumns" v-model="activeColumns.createdBy">
						{{ $t('task.attributes.createdBy') }}
					</fancycheckbox>
				</card>
			</transition>
			<filter-popup
				@change="loadTasks(1)"
				:visible="showTaskFilter"
				v-model="params"
			/>
		</div>

		<card :padding="false" :has-content="false">
			<div class="has-horizontal-overflow">
				<table class="table has-actions is-hoverable is-fullwidth mb-0">
					<thead>
					<tr>
						<th v-if="activeColumns.id">
							#
							<sort :order="sortBy.id" @click="sort('id')"/>
						</th>
						<th v-if="activeColumns.done">
							{{ $t('task.attributes.done') }}
							<sort :order="sortBy.done" @click="sort('done')"/>
						</th>
						<th v-if="activeColumns.title">
							{{ $t('task.attributes.title') }}
							<sort :order="sortBy.title" @click="sort('title')"/>
						</th>
						<th v-if="activeColumns.priority">
							{{ $t('task.attributes.priority') }}
							<sort :order="sortBy.priority" @click="sort('priority')"/>
						</th>
						<th v-if="activeColumns.labels">
							{{ $t('task.attributes.labels') }}
						</th>
						<th v-if="activeColumns.assignees">
							{{ $t('task.attributes.assignees') }}
						</th>
						<th v-if="activeColumns.dueDate">
							{{ $t('task.attributes.dueDate') }}
							<sort :order="sortBy.due_date" @click="sort('due_date')"/>
						</th>
						<th v-if="activeColumns.startDate">
							{{ $t('task.attributes.startDate') }}
							<sort :order="sortBy.start_date" @click="sort('start_date')"/>
						</th>
						<th v-if="activeColumns.endDate">
							{{ $t('task.attributes.endDate') }}
							<sort :order="sortBy.end_date" @click="sort('end_date')"/>
						</th>
						<th v-if="activeColumns.percentDone">
							{{ $t('task.attributes.percentDone') }}
							<sort :order="sortBy.percent_done" @click="sort('percent_done')"/>
						</th>
						<th v-if="activeColumns.created">
							{{ $t('task.attributes.created') }}
							<sort :order="sortBy.created" @click="sort('created')"/>
						</th>
						<th v-if="activeColumns.updated">
							{{ $t('task.attributes.updated') }}
							<sort :order="sortBy.updated" @click="sort('updated')"/>
						</th>
						<th v-if="activeColumns.createdBy">
							{{ $t('task.attributes.createdBy') }}
						</th>
					</tr>
					</thead>
					<tbody>
					<tr :key="t.id" v-for="t in tasks">
						<td v-if="activeColumns.id">
							<router-link :to="{name: 'task.detail', params: { id: t.id }}">
								<template v-if="t.identifier === ''">
									#{{ t.index }}
								</template>
								<template v-else>
									{{ t.identifier }}
								</template>
							</router-link>
						</td>
						<td v-if="activeColumns.done">
							<div class="is-done" v-if="t.done">Done</div>
						</td>
						<td v-if="activeColumns.title">
							<router-link :to="{name: 'task.detail', params: { id: t.id }}">{{ t.title }}</router-link>
						</td>
						<td v-if="activeColumns.priority">
							<priority-label :priority="t.priority" :done="t.done" :show-all="true"/>
						</td>
						<td v-if="activeColumns.labels">
							<labels :labels="t.labels"/>
						</td>
						<td v-if="activeColumns.assignees">
							<user
								:avatar-size="27"
								:is-inline="true"
								:key="t.id + 'assignee' + a.id + i"
								:show-username="false"
								:user="a"
								v-for="(a, i) in t.assignees"
							/>
						</td>
						<date-table-cell :date="t.dueDate" v-if="activeColumns.dueDate"/>
						<date-table-cell :date="t.startDate" v-if="activeColumns.startDate"/>
						<date-table-cell :date="t.endDate" v-if="activeColumns.endDate"/>
						<td v-if="activeColumns.percentDone">{{ t.percentDone * 100 }}%</td>
						<date-table-cell :date="t.created" v-if="activeColumns.created"/>
						<date-table-cell :date="t.updated" v-if="activeColumns.updated"/>
						<td v-if="activeColumns.createdBy">
							<user
								:avatar-size="27"
								:show-username="false"
								:user="t.createdBy"/>
						</td>
					</tr>
					</tbody>
				</table>
			</div>

			<Pagination 
				:total-pages="taskCollectionService.totalPages"
				:current-page="currentPage"
			/>
		</card>

		<!-- This router view is used to show the task popup while keeping the table view itself -->
		<transition name="modal">
			<router-view/>
		</transition>

	</div>
</template>

<script>
import taskList from '../../../components/tasks/mixins/taskList'
import User from '../../../components/misc/user'
import PriorityLabel from '../../../components/tasks/partials/priorityLabel'
import Labels from '../../../components/tasks/partials/labels'
import DateTableCell from '../../../components/tasks/partials/date-table-cell'
import Fancycheckbox from '../../../components/input/fancycheckbox'
import Sort from '../../../components/tasks/partials/sort'
import {saveListView} from '@/helpers/saveListView'
import FilterPopup from '@/components/list/partials/filter-popup.vue'
import Pagination from '@/components/misc/pagination.vue'

export default {
	name: 'Table',
	components: {
		FilterPopup,
		Sort,
		Fancycheckbox,
		DateTableCell,
		Labels,
		PriorityLabel,
		User,
		Pagination,
	},
	mixins: [
		taskList,
	],
	data() {
		return {
			showActiveColumnsFilter: false,
			activeColumns: {
				id: true,
				done: true,
				title: true,
				priority: false,
				labels: true,
				assignees: true,
				dueDate: true,
				startDate: false,
				endDate: false,
				percentDone: false,
				created: false,
				updated: false,
				createdBy: false,
			},
			sortBy: {
				id: 'desc',
			},
		}
	},
	created() {
		const savedShowColumns = localStorage.getItem('tableViewColumns')
		if (savedShowColumns !== null) {
			this.$set(this, 'activeColumns', JSON.parse(savedShowColumns))
		}
		const savedSortBy = localStorage.getItem('tableViewSortBy')
		if (savedSortBy !== null) {
			this.$set(this, 'sortBy', JSON.parse(savedSortBy))
		}

		this.$set(this.params, 'filter_by', [])
		this.$set(this.params, 'filter_value', [])
		this.$set(this.params, 'filter_comparator', [])

		this.initTasks(1)

		// Save the current list view to local storage
		// We use local storage and not vuex here to make it persistent across reloads.
		saveListView(this.$route.params.listId, this.$route.name)
	},
	methods: {
		initTasks(page, search = '') {
			// This makes sure an id sort order is always sorted last.
			// When tasks would be sorted first by id and then by whatever else was specified, the id sort takes
			// precedence over everything else, making any other sort columns pretty useless.
			const sortKeys = Object.keys(this.sortBy)
			let hasIdFilter = false
			for (const s of sortKeys) {
				if (s === 'id') {
					sortKeys.splice(s, 1)
					hasIdFilter = true
					break
				}
			}
			if (hasIdFilter) {
				sortKeys.push('id')
			}
			
			const params = this.params
			params.sort_by = []
			params.order_by = []
			sortKeys.map(s => {
				params.sort_by.push(s)
				params.order_by.push(this.sortBy[s])
			})
			this.loadTasks(page, search, params)
		},
		sort(property) {
			const order = this.sortBy[property]
			if (typeof order === 'undefined' || order === 'none') {
				this.$set(this.sortBy, property, 'desc')
			} else if (order === 'desc') {
				this.$set(this.sortBy, property, 'asc')
			} else {
				this.$delete(this.sortBy, property)
			}
			this.initTasks(this.currentPage, this.searchTerm)
			// Save the order to be able to retrieve them later
			localStorage.setItem('tableViewSortBy', JSON.stringify(this.sortBy))
		},
		saveTaskColumns() {
			localStorage.setItem('tableViewColumns', JSON.stringify(this.activeColumns))
		},
	},
}
</script>
