import { numbersPhones } from '../../Services/whatsapp-web/dbtest/returnDb.ts'

async function verifyNumber(client) {

  console.log("executando VERIFICAÇÃO DE NUMEROS")
  //buscar no banco todos os pacientes para confirmação
  const listPhonesToVerify = await numbersPhones()
  //verificar quais números possuem whatsapp e retornar
  const listPac = []
  try {

    for (const numberPhone of listPhonesToVerify) {
      const verifiedNumber = await client.getNumberId(numberPhone.phone)


      if (verifiedNumber) {
        //console.log("NUMERO VALIDO", verifiedNumber)
        listPac.push({ name: numberPhone.nome, phone: verifiedNumber.user, valid: true })
      }
      else {
        listPac.push({ name: numberPhone.nome, phone: numberPhone.phone, valid: false })
      }

    }
    //const numero = await client.getNumberId('31990691174')
    //console.log('NÚMERO VÁLIDO:', numero);
    // listPac.push(numero)

  } catch (error) {
    console.log("ERRO:::", error)
  }
  console.log("NUMEROS VERIFICADOS>>>", listPac)
  return listPac

}

module.exports = { verifyNumber }
