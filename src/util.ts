import Promit from "./Promit"
import PromiseState from "./PromiseState"

const util = {
	unwrap(promise:Promit, func:any, value:any) {
		process.nextTick(function():any {
			let returnValue
			try {
				returnValue = func(value) // 取then裡面的值
			} catch (e) {
				return util.reject(promise, e)
			}
			if (returnValue === promise) { // return 了 this?
				util.reject(promise, new TypeError('Cannot resolve promise with itself'))
			} else {
				util.resolve(promise, returnValue)
			}
		})
	},
	safelyResolveThenable(self: Promit, thenable:Function) {
		// Either fulfill, reject or reject with error
		let called = false
		function onError(e: Error):any {
			if (called) {
				return
			}
			called = true	// resolve, reject 只能call 一次
			util.reject(self, e)
		}

		function onSuccess(value:any):any {
			if (called) {
				return
			}
			called = true
			util.resolve(self, value)
		}

		function tryToUnwrap() :void{
			thenable(onSuccess, onError) // 調用構造函數中的函數
		}

		const result:any = util.tryCatch(tryToUnwrap)
		if (result.status === 'error') {
			onError(result.value)
		}
	},
	tryCatch(func:Function, value?:any):any {
		const out: { value:any; status:string} = {
			value: null,
			status: "",
		}
		try {
			out.value = func(value)
			out.status = 'success'
		} catch (e) {
			out.status = 'error'
			out.value = e
		}
		return out
	},
	resolve(promise: Promit, value: any): Promit {
		if (value instanceof Promise) {	// 返回了一個promise
			// eslint-disable-next-line promise/catch-or-return
			process.nextTick(() => {
				return value.then((data) => {
					util.resolve(promise, data)
					return null
				}, (reason) => {
					util.reject(promise, reason)
					return null
				})
			})
		} else {
			promise.state = PromiseState.FULFILLED
			promise.outcome = value
			// 上面改變本身狀態，下面進行下一級操作
			let i = -1
			const len = promise.queue.length
			while (++i < len) {
				if (promise.queue[i].onFulfilled) {
					promise.queue[i].callFulfilled(value)
				} else {
					util.resolve(promise.queue[i].promit, value)
				}
			}
		}
		return promise
	},
	reject(promise: Promit, reason: any): Promit {
		promise.state = PromiseState.REJECTED
		promise.outcome = reason
		if (promise.handled === false) {
			process.nextTick(function() {
				if (promise.handled === false) {
					process.emitWarning('unhandledRejection', 'Warning')
				}
			})
		}
		let i = -1
		const len = promise.queue.length
		while (++i < len) {
			if (promise.queue[i].onRejected) {
				promise.queue[i].callRejected(reason)
			} else {
				util.reject(promise.queue[i].promit, reason)
			}
		}
		return promise
	},
}

export default util
