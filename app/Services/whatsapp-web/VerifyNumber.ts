import { numbersPhones } from '../../Services/whatsapp-web/dbtest/returnDb.ts'

async function verifyNumber(client) {

  console.log("executando VERIFICAÇÃO DE NUMEROS")
  //buscar no banco todos os pacientes para confirmação
  const listPhonesToVerify = await numbersPhones()
  //verificar quais números possuem whatsapp e retornar
  const listPac = []
  try {

    for (const numberPhone of listPhonesToVerify) {
      console.log("VERIFICAR CADA NUMERO:::", numberPhone.phone)
      const verifiedNumber = await client.getNumberId(numberPhone.phone)
      if (verifiedNumber) {
        //console.log("NUMERO VALIDO", verifiedNumber)
        listPac.push(verifiedNumber)
      }
      else {
        console.log("NUMERO INVÁLIDO", verifiedNumber)
      }

    }

    // const numero = await client.getNumberId('31985228619')
    // listPac.push(numero)
    // console.log('NÚMERO VÁLIDO 222:', listPac);

  } catch (error) {
    console.log("ERRO:::", error)
  }

  console.log("NUMEROS VERIFICADOS>>>", listPac)

  return listPac



}

module.exports = { verifyNumber }
