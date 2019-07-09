import Promit from "./Promit"


/**
 * QueueItem
 */
class QueueItem {
	promit: Promit
	onFulfilled?: Function
	onRejected?: Function

	constructor(promit: Promit, onFulfilled: Function, onRejected: Function) {
		this.promit = promit
		if (typeof onFulfilled === 'function') {
			this.onFulfilled = onFulfilled
		}
		if (typeof onRejected === 'function') {
			this.onRejected = onRejected
		}
	}
	callFulfilled(value: any): void {
		this.promit.unwrap(this.onFulfilled, value)
	}
	callRejected(reason: any): void {
		this.promit.unwrap(this.onRejected, reason)
	}
}

export default QueueItem
