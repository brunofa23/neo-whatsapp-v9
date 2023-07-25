function getRandomSeconds(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function temporizadorComSegundosRandomicos() {
  const minDelay = 3; // Segundos mínimos
  const maxDelay = 10; // Segundos máximos

  const randomSeconds = getRandomSeconds(minDelay, maxDelay);

  console.log(`Iniciando a ação. Tempo de atraso: ${randomSeconds} segundos.`);

  setTimeout(() => {
    console.log(`Ação concluída após ${randomSeconds} segundos.`);
    // Aqui você pode colocar a lógica da ação que deseja executar após o atraso
  }, randomSeconds * 1000); // Converte o atraso para milissegundos
}

// Chamando a função temporizadora
temporizadorComSegundosRandomicos();
