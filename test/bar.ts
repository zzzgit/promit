import Promise from "../src/Promit"

new Promise((resolve:any, reject:any)=>{
	resolve(333)
	console.log(222, (reject + "").replace(/./gm, ""))
}).then((data:any)=>{
	return new Promise((resolve: any, reject: any) => {
		console.log(444, (data + reject).replace(/./gm, ""))
		resolve(444)
	})
})
	.then((data:any)=>console.log(11, data))
	.catch((e: any)=>console.log(22, e))

console.log(new Promise(()=>{}))
export default {}
