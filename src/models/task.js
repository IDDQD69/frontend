import AbstractModel from './abstractModel'
import UserModel from './user'
import LabelModel from './label'
import AttachmentModel from './attachment'
import {REPEAT_MODE_DEFAULT} from './constants/taskRepeatModes'

import SubscriptionModel from '@/models/subscription'
import {parseDateOrNull} from '@/helpers/parseDateOrNull'

export default class TaskModel extends AbstractModel {

	defaultColor = '198CFF'

	constructor(data) {
		super(data)

		this.id = Number(this.id)
		this.title = this.title?.trim()
		this.listId = Number(this.listId)

		// Make date objects from timestamps
		this.dueDate = parseDateOrNull(this.dueDate)
		this.startDate = parseDateOrNull(this.startDate)
		this.endDate = parseDateOrNull(this.endDate)
		this.doneAt = parseDateOrNull(this.doneAt)

		// Cancel all scheduled notifications for this task to be sure to only have available notifications
		this.cancelScheduledNotifications()
			.then(() => {
				this.reminderDates = this.reminderDates.map(d => {
					d = new Date(d)
					// Every time we see a reminder, we schedule a notification for it
					this.scheduleNotification(d)
					return d
				})
			})

		// Parse the repeat after into something usable
		this.parseRepeatAfter()

		// Parse the assignees into user models
		this.assignees = this.assignees.map(a => {
			return new UserModel(a)
		})
		this.createdBy = new UserModel(this.createdBy)

		this.labels = this.labels.map(l => {
			return new LabelModel(l)
		})
			.sort((f, s) => f.title > s.title ? 1 : -1)

		if (this.hexColor !== '' && this.hexColor.substring(0, 1) !== '#') {
			this.hexColor = '#' + this.hexColor
		}

		// Make all subtasks to task models
		Object.keys(this.relatedTasks).forEach(relationKind => {
			this.relatedTasks[relationKind] = this.relatedTasks[relationKind].map(t => {
				return new TaskModel(t)
			})
		})

		// Make all attachments to attachment models
		this.attachments = this.attachments.map(a => {
			return new AttachmentModel(a)
		})

		// Set the task identifier to empty if the list does not have one
		if (this.identifier === `-${this.index}`) {
			this.identifier = ''
		}

		if (typeof this.subscription !== 'undefined' && this.subscription !== null) {
			this.subscription = new SubscriptionModel(this.subscription)
		}

		this.created = new Date(this.created)
		this.updated = new Date(this.updated)
	}

	defaults() {
		return {
			id: 0,
			title: '',
			description: '',
			done: false,
			doneAt: null,
			priority: 0,
			labels: [],
			assignees: [],

			dueDate: 0,
			startDate: 0,
			endDate: 0,
			repeatAfter: 0,
			repeatFromCurrentDate: false,
			repeatMode: REPEAT_MODE_DEFAULT,
			reminderDates: [],
			parentTaskId: 0,
			hexColor: '',
			percentDone: 0,
			relatedTasks: {},
			attachments: [],
			identifier: '',
			index: 0,
			isFavorite: false,
			subscription: null,
			
			position: 0,
			kanbanPosition: 0,

			createdBy: UserModel,
			created: null,
			updated: null,

			listId: 0, // Meta, only used when creating a new task
		}
	}

	getTextIdentifier() {
		if (this.identifier === '') {
			return `#${this.index}`
		}

		return this.identifier
	}

	getHexColor() {
		if (this.hexColor === '') {
			return `#${this.defaultColor}`
		}

		return this.hexColor
	}

	/////////////////
	// Helper functions
	///////////////

	/**
	 * Parses the "repeat after x seconds" from the task into a usable js object inside the task.
	 * This function should only be called from the constructor.
	 */
	parseRepeatAfter() {
		let repeatAfterHours = (this.repeatAfter / 60) / 60
		this.repeatAfter = {type: 'hours', amount: repeatAfterHours}

		// if its dividable by 24, its something with days, otherwise hours
		if (repeatAfterHours % 24 === 0) {
			let repeatAfterDays = repeatAfterHours / 24
			if (repeatAfterDays % 7 === 0) {
				this.repeatAfter.type = 'weeks'
				this.repeatAfter.amount = repeatAfterDays / 7
			} else if (repeatAfterDays % 30 === 0) {
				this.repeatAfter.type = 'months'
				this.repeatAfter.amount = repeatAfterDays / 30
			} else if (repeatAfterDays % 365 === 0) {
				this.repeatAfter.type = 'years'
				this.repeatAfter.amount = repeatAfterDays / 365
			} else {
				this.repeatAfter.type = 'days'
				this.repeatAfter.amount = repeatAfterDays
			}
		}
	}

	async cancelScheduledNotifications() {
		if (!('showTrigger' in Notification.prototype)) {
			console.debug('This browser does not support triggered notifications')
			return
		}

		if (typeof navigator.serviceWorker === 'undefined') {
			console.debug('Service Worker not available')
			return
		}

		const registration = await navigator.serviceWorker.getRegistration()
		if (typeof registration === 'undefined') {
			return
		}

		// Get all scheduled notifications for this task and cancel them
		const scheduledNotifications = await registration.getNotifications({
			tag: `vikunja-task-${this.id}`,
			includeTriggered: true,
		})
		console.debug('Already scheduled notifications:', scheduledNotifications)
		scheduledNotifications.forEach(n => n.close())
	}

	async scheduleNotification(date) {
		if (typeof navigator.serviceWorker === 'undefined') {
			console.debug('Service Worker not available')
			return
		}

		if (date < new Date()) {
			console.debug('Date is in the past, not scheduling a notification. Date is ', date)
			return
		}

		if (!('showTrigger' in Notification.prototype)) {
			console.debug('This browser does not support triggered notifications')
			return
		}

		const {state} = await navigator.permissions.request({name: 'notifications'})
		if (state !== 'granted') {
			console.debug('Notification permission not granted, not showing notifications')
			return
		}

		const registration = await navigator.serviceWorker.getRegistration()
		if (typeof registration === 'undefined') {
			console.error('No service worker registration available')
			return
		}

		// Register the actual notification
		registration.showNotification('Vikunja Reminder', {
			tag: `vikunja-task-${this.id}`, // Group notifications by task id so we're only showing one notification per task
			body: this.title,
			// eslint-disable-next-line no-undef
			showTrigger: new TimestampTrigger(date),
			badge: '/images/icons/badge-monochrome.png',
			icon: '/images/icons/android-chrome-512x512.png',
			data: {taskId: this.id},
			actions: [
				{
					action: 'show-task',
					title: 'Show task',
				},
			],
		})
			.then(() => {
				console.debug('Notification scheduled for ' + date)
			})
			.catch(e => {
				console.debug('Error scheduling notification', e)
			})
	}
}

