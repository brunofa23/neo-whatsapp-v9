async function numbersPhones() {

  const listPhones = await require('../dbtest/numbersPhones.json')
  //console.log("LISTA DE TELEFONES:::", listPhones)
  return listPhones

}

module.exports = { numbersPhones }
