
function validatePhone(phone) {
  console.log("teste")
  // Expressão regular para validar o formato de um número de celular no Brasil
  const regexTelefoneCelular = /^(\+55|55)?\s?(?:\(?0?[1-9]{2}\)?)?\s?(?:9\s?)?[6789]\d{3}[-\s]?\d{4}$/;
  return regexTelefoneCelular.test(phone);
}

console.log(validatePhone("553185228619"))
