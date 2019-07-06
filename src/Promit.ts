import QueueItem from "./Queueitem"
import PromiseState from "./PromiseState"
import util from "./util"

const INTERNAL= ():void=> { }

class Promit {
    outcome: any = void 0
    queue: QueueItem[] = []
	handled: boolean = false
	state: PromiseState = PromiseState.PENDING

	static resolve(value:any) :Promit {
		if (value instanceof this) {
			return value
		}
		return util.resolve(new Promit(INTERNAL), value)
	}
	static reject(reason: any):Promit {
		const promise = new this(INTERNAL)
		return util.reject(promise, reason)
	}
	static all(iterable:Promit[]):Promit {
		if (Object.prototype.toString.call(iterable) !== '[object Array]') {
			return this.reject(new TypeError('must be an array'))
		}
		const len = iterable.length
		let called = false
		if (!len) {
			return this.resolve([])
		}
		const values = new Array(len)
		let resolved = 0
		let i = -1
		const promise = new this(INTERNAL)

		while (++i < len) {
			allResolver(iterable[i], i)
		}
		return promise
		function allResolver(value:any, i:number) :Promit {
			return Promit.resolve(value).then(resolveFromAll, (error:Error):void =>{
				if (!called) {
					called = true
					util.reject(promise, error)
				}
			})
			function resolveFromAll(outValue:any):void {
				values[i] = outValue
				if (++resolved === len && !called) {
					called = true
					util.resolve(promise, values)
				}
			}
		}
	}
	static race(iterable:Promit[]):Promit {
		if (Object.prototype.toString.call(iterable) !== '[object Array]') {
			return this.reject(new TypeError('must be an array'))
		}
		const len = iterable.length
		let called = false
		if (!len) {
			return this.resolve([])
		}
		let i = -1
		const promise = new this(INTERNAL)
		while (++i < len) {
			resolver(iterable[i])
		}
		return promise
		function resolver(value:any):Promit {
			return Promit.resolve(value).then(function(response:any):any {
				if (!called) {
					called = true
					util.resolve(promise, response)
				}
				return null
			}, function(error:Error):void {
				if (!called) {
					called = true
					util.reject(promise, error)
				}
			})
		}
	}
	constructor(resolver: Function) {
		if (typeof resolver !== 'function') {
			throw new TypeError('resolver must be a function')
		}
		if (resolver !== INTERNAL) {
			util.safelyResolveThenable(this, resolver)
		}
	}
	finally(cbd: any):Promit {
		if (typeof cbd !== 'function') {
			return this
		}
		cbd = cbd as Function
		function resolve(value:any):Promit {
			function yes() :any {
				return value
			}
			return Promit.resolve(cbd()).then(yes)
		}
		function reject(reason:Error):Promit {
			function no():void {
				throw reason
			}
			return Promit.resolve(cbd()).then(no)
		}
		return this.then(resolve, reject)
	}
	then(onFulfilled?: Function, onRejected?: Function):Promit {
		if (typeof onFulfilled !== 'function' && this.state === PromiseState.FULFILLED || // 參數不對，不作處理，不用管這行
			typeof onRejected !== 'function' && this.state === PromiseState.REJECTED) {
			return this
		}
		onRejected = onRejected as Function
		onFulfilled = onFulfilled as Function
		const promise = new Promit(INTERNAL)
		this.handled = true
		if (this.state === PromiseState.PENDING) {
			this.queue.push(new QueueItem(promise, onFulfilled, onRejected))
			return promise
		}
		const resolver = this.state === PromiseState.FULFILLED ? onFulfilled : onRejected
		util.unwrap(promise, resolver, this.outcome)	//  unwrap 下一級
		return promise
	}
	catch(onRejected:Function):Promit {
		return this.then(undefined, onRejected)
	}
}


export default Promit
