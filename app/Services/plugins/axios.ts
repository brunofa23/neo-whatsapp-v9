import axios from 'axios'

console.log(">>>", process.env.SERVER_URL_API_NEO)
const envServerUrl = `${process.env.SERVER_URL_API_NEO}`
console.log("ENV>>", envServerUrl)
axios.defaults.baseURL = envServerUrl
axios.defaults.headers.common['Content-Type'] = 'application/json'
axios.defaults.timeout = 1200000


export default axios
