const { DateTime } = require('luxon');

function dateFormat(format, date = DateTime.local()) {
  // Verificar se a data é válida
  if (!(date instanceof DateTime)) {
    throw new Error('A data fornecida não é válida. Certifique-se de passar um objeto DateTime.');
  }

  // Formatando a data no formato especificado
  return date.toFormat(format);
}

// Exemplo de uso:
const formattedDate = dateFormat("dd/MM/yyyy HH:mm:ss");
console.log(formattedDate); // Exibe a data atual no formato especificado
