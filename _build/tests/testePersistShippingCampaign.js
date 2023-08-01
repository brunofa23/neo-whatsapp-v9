function getRandomSeconds(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function temporizadorComSegundosRandomicos() {
    const minDelay = 3;
    const maxDelay = 10;
    const randomSeconds = getRandomSeconds(minDelay, maxDelay);
    console.log(`Iniciando a ação. Tempo de atraso: ${randomSeconds} segundos.`);
    setTimeout(() => {
        console.log(`Ação concluída após ${randomSeconds} segundos.`);
    }, randomSeconds * 1000);
}
temporizadorComSegundosRandomicos();
//# sourceMappingURL=testePersistShippingCampaign.js.map