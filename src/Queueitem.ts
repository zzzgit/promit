import Promit from "./Promit"
import util from "./util"


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
		util.unwrap(this.promit, this.onFulfilled, value)
	}
	callRejected(reason: any): void {
		util.unwrap(this.promit, this.onRejected, reason)
	}
}

export default QueueItem
