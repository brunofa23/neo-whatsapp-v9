// // const greetingList = ['Olá', 'Oi tudo bem?', 'Saudações', 'Oi como vai?'];

// // function getRandomGreeting() {
// //   const randomIndex = Math.floor(Math.random() * greetingList.length);
// //   return greetingList[randomIndex];
// // }

// // // Exemplo de uso
// // const randomGreeting = getRandomGreeting();
// // console.log(randomGreeting);



// function getRandomGreeting() {
//   const greetingList = ['Olá', 'Oi tudo bem?', 'Saudações', 'Oi como vai?'];
//   //const randomIndex = Math.floor(Math.random() * greetingList.length);
//   return greetingList[Math.floor(Math.random() * greetingList.length)];
// }

// // Exemplo de uso
// const randomGreeting = getRandomGreeting();
// console.log(randomGreeting);

import { DateTime } from "luxon"
const date = require('../app/Services/whatsapp-web/util.ts')

const data = date.DateFormat("YYYY-mm_dd")
console.log("DATA", data)
