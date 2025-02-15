<template>
	<div class="task-relations">
		<x-button
			v-if="Object.keys(relatedTasks).length > 0"
			@click="showNewRelationForm = !showNewRelationForm"
			class="is-pulled-right add-task-relation-button"
			:class="{'is-active': showNewRelationForm}"
			v-tooltip="$t('task.relation.add')"
			type="secondary"
			icon="plus"
			:shadow="false"
		/>
		<transition-group name="fade">
			<template v-if="editEnabled && showCreate">
				<label class="label" key="label">
					{{ $t('task.relation.new') }}
					<transition name="fade">
						<span class="is-inline-flex" v-if="taskRelationService.loading">
							<span class="loader is-inline-block mr-2"></span>
							{{ $t('misc.saving') }}
						</span>
						<span class="has-text-success" v-else-if="!taskRelationService.loading && saved">
							{{ $t('misc.saved') }}
						</span>
					</transition>
				</label>
				<div class="field" key="field-search">
					<multiselect
						:placeholder="$t('task.relation.searchPlaceholder')"
						@search="findTasks"
						:loading="taskService.loading"
						:search-results="foundTasks"
						label="title"
						v-model="newTaskRelationTask"
						:creatable="true"
						:create-placeholder="$t('task.relation.createPlaceholder')"
						@create="createAndRelateTask"
					>
						<template #searchResult="props">
							<span v-if="typeof props.option !== 'string'" class="search-result">
								<span
									class="different-list"
									v-if="props.option.listId !== listId"
									v-tooltip="$t('task.relation.differentList')">
									{{ $store.getters['lists/getListById'](props.option.listId) === null ? '' : $store.getters['lists/getListById'](props.option.listId).title }} >
								</span>
								{{ props.option.title }}
							</span>
							<span class="search-result" v-else>
								{{ props.option }}
							</span>
						</template>
					</multiselect>
				</div>
				<div class="field has-addons mb-4" key="field-kind">
					<div class="control is-expanded">
						<div class="select is-fullwidth has-defaults">
							<select v-model="newTaskRelationKind">
								<option value="unset">{{ $t('task.relation.select') }}</option>
								<option :key="rk" :value="rk" v-for="rk in relationKinds">
									{{ $tc(`task.relation.kinds.${rk}`, 1) }}
								</option>
							</select>
						</div>
					</div>
					<div class="control">
						<x-button @click="addTaskRelation()">{{ $t('task.relation.add') }}</x-button>
					</div>
				</div>
			</template>
		</transition-group>

		<div :key="kind" class="related-tasks" v-for="(rts, kind ) in relatedTasks">
			<template v-if="rts.length > 0">
				<span class="title">{{ relationKindTitle(kind, rts.length) }}</span>
				<div class="tasks noborder">
					<div :key="t.id" class="task" v-for="t in rts.filter(t => t)">
						<router-link :to="{ name: $route.name, params: { id: t.id } }">
							<span :class="{ 'done': t.done}" class="tasktext">
								<span
									class="different-list"
									v-if="t.listId !== listId"
									v-tooltip="$t('task.relation.differentList')">
									{{
										$store.getters['lists/getListById'](t.listId) === null ? '' : $store.getters['lists/getListById'](t.listId).title
									}} >
								</span>
								{{ t.title }}
							</span>
						</router-link>
						<a
							@click="() => {showDeleteModal = true; relationToDelete = {relationKind: kind, otherTaskId: t.id}}"
							class="remove"
							v-if="editEnabled">
							<icon icon="trash-alt"/>
						</a>
					</div>
				</div>
			</template>
		</div>
		<p class="none" v-if="showNoRelationsNotice && Object.keys(relatedTasks).length === 0">
			{{ $t('task.relation.noneYet') }}
		</p>

		<!-- Delete modal -->
		<transition name="modal">
			<modal
				@close="showDeleteModal = false"
				@submit="removeTaskRelation()"
				v-if="showDeleteModal"
			>
				<template #header><span>{{ $t('task.relation.delete') }}</span></template>
				
				<template #text>
					<p>{{ $t('task.relation.deleteText1') }}<br/>
					<strong>{{ $t('task.relation.deleteText2') }}</strong></p>
				</template>
			</modal>
		</transition>
	</div>
</template>

<script>
import TaskService from '../../../services/task'
import TaskModel from '../../../models/task'
import TaskRelationService from '../../../services/taskRelation'
import relationKinds from '../../../models/constants/relationKinds'
import TaskRelationModel from '../../../models/taskRelation'

import Multiselect from '@/components/input/multiselect.vue'

export default {
	name: 'relatedTasks',
	data() {
		return {
			relatedTasks: {},
			taskService: new TaskService(),
			foundTasks: [],
			relationKinds: relationKinds,
			newTaskRelationTask: new TaskModel(),
			newTaskRelationKind: 'related',
			taskRelationService: new TaskRelationService(),
			showDeleteModal: false,
			relationToDelete: {},
			saved: false,
			showNewRelationForm: false,
		}
	},
	components: {
		Multiselect,
	},
	props: {
		taskId: {
			type: Number,
			required: true,
		},
		initialRelatedTasks: {
			type: Object,
			default: () => {
			},
		},
		showNoRelationsNotice: {
			type: Boolean,
			default: false,
		},
		listId: {
			type: Number,
			default: 0,
		},
		editEnabled: {
			default: true,
		},
	},
	watch: {
		initialRelatedTasks: {
			handler(value) {
				this.relatedTasks = value
			},
			immediate: true,
		},
	},
	computed: {
		showCreate() {
			return Object.keys(this.relatedTasks).length === 0 || this.showNewRelationForm
		},
	},
	methods: {
		findTasks(query) {
			this.taskService.getAll({}, {s: query})
				.then(response => {
					this.$set(this, 'foundTasks', response)
				})
				.catch(e => {
					this.$message.error(e)
				})
		},
		addTaskRelation() {
			let rel = new TaskRelationModel({
				taskId: this.taskId,
				otherTaskId: this.newTaskRelationTask.id,
				relationKind: this.newTaskRelationKind,
			})
			this.taskRelationService.create(rel)
				.then(() => {
					if (!this.relatedTasks[this.newTaskRelationKind]) {
						this.$set(this.relatedTasks, this.newTaskRelationKind, [])
					}
					this.relatedTasks[this.newTaskRelationKind].push(this.newTaskRelationTask)
					this.newTaskRelationTask = null
					this.saved = true
					this.showNewRelationForm = false
					setTimeout(() => {
						this.saved = false
					}, 2000)
				})
				.catch(e => {
					this.$message.error(e)
				})
		},
		removeTaskRelation() {
			const rel = new TaskRelationModel({
				relationKind: this.relationToDelete.relationKind,
				taskId: this.taskId,
				otherTaskId: this.relationToDelete.otherTaskId,
			})
			this.taskRelationService.delete(rel)
				.then(() => {
					Object.keys(this.relatedTasks).forEach(relationKind => {
						for (const t in this.relatedTasks[relationKind]) {
							if (this.relatedTasks[relationKind][t].id === this.relationToDelete.otherTaskId && relationKind === this.relationToDelete.relationKind) {
								this.relatedTasks[relationKind].splice(t, 1)
							}
						}
					})
					this.saved = true
					setTimeout(() => {
						this.saved = false
					}, 2000)
				})
				.catch(e => {
					this.$message.error(e)
				})
				.finally(() => {
					this.showDeleteModal = false
				})
		},
		createAndRelateTask(title) {
			const newTask = new TaskModel({title: title, listId: this.listId})
			this.taskService.create(newTask)
				.then(r => {
					this.newTaskRelationTask = r
					this.addTaskRelation()
				})
				.catch(e => {
					this.$message.error(e)
				})
		},
		relationKindTitle(kind, length) {
			return this.$tc(`task.relation.kinds.${kind}`, length)
		},
	},
}
</script>

<style lang="scss">
.add-task-relation-button {
	margin-top: -3rem;

	svg {
		transition: transform $transition;
	}

	&.is-active svg {
		transform: rotate(45deg);
	}
}
</style>
