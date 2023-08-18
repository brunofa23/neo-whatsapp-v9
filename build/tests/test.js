const inputString = "Isso está";
const regex = /(1|sim|ok|pode|confirmado)/i;
if (regex.test(inputString)) {
    console.log("A string contém uma das palavras.");
}
else {
    console.log("A string não contém nenhuma das palavras.");
}
//# sourceMappingURL=test.js.map