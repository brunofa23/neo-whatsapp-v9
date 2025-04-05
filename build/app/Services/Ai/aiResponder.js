"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.responderPergunta = void 0;
const node_nlp_1 = require("node-nlp");
const string_similarity_1 = __importDefault(require("string-similarity"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Faq_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Faq"));
const axios_1 = __importDefault(require("axios"));
const openai_1 = require("openai");
const openai = new openai_1.OpenAI({
    apiKey: Env_1.default.get('OPENAI_API_KEY'),
});
async function criarGerenciador(perguntas) {
    const manager = new node_nlp_1.NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } });
    perguntas.forEach((item, index) => {
        manager.addDocument('pt', item.ask, `pergunta.${index}`);
        manager.addAnswer('pt', `pergunta.${index}`, item.answer);
    });
    await manager.train();
    return manager;
}
async function fallbackParaIA(perguntaUsuario, perguntas, informationContext) {
    const contexto = perguntas.map((p) => `Q: ${p.ask}\nA: ${p.answer}`).join('\n\n');
    const messages = [
        {
            role: 'system',
            content: `Você é uma atendente de call center de um hospital e só pode responder com base nas perguntas e respostas abaixo.
      Se a pergunta do usuário não estiver claramente presente ou relacionada diga "Desculpe, não tenho essa resposta".
      Responda de forma clara, objetiva e educada.
      Sempre responda em português.`,
        },
        {
            role: 'user',
            content: `Baseado nas perguntas abaixo, responda de forma direta:

${contexto}

Informações adicionais do paciente: ${informationContext}

Pergunta: ${perguntaUsuario}`,
        },
    ];
    if (Env_1.default.get('USE_OPENROUTER') === 'true') {
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
            model: Env_1.default.get('OPENROUTER_MODEL', 'openai/gpt-3.5-turbo'),
            messages,
            temperature: 0.5,
            max_tokens: 500,
        }, {
            headers: {
                Authorization: `Bearer ${Env_1.default.get('OPENROUTER_API_KEY')}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data.choices?.[0]?.message?.content?.trim() || 'Desculpe, não entendi sua pergunta.';
    }
    else {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.5,
            max_tokens: 500,
        });
        return completion.choices[0].message?.content?.trim() || 'Desculpe, não entendi sua pergunta.';
    }
}
async function responderPergunta(perguntaUsuario, informationContext = '') {
    const query = await Faq_1.default.query().select('ask', 'answer');
    const perguntas = query.map((item) => item.ask);
    const manager = await criarGerenciador(query);
    const resultado = await manager.process('pt', perguntaUsuario);
    const match = string_similarity_1.default.findBestMatch(perguntaUsuario, perguntas);
    const similaridade = match.bestMatch.rating;
    const perguntaMaisParecida = match.bestMatch.target;
    const indexMaisParecido = perguntas.findIndex((p) => p === perguntaMaisParecida);
    const respostaMaisParecida = query[indexMaisParecido]?.answer;
    console.log('Score NLP:', resultado.score);
    console.log('Similaridade:', similaridade);
    console.log('Pergunta mais parecida:', perguntaMaisParecida);
    if (similaridade >= 0.6 && respostaMaisParecida) {
        return respostaMaisParecida;
    }
    return await fallbackParaIA(perguntaUsuario, query, informationContext);
}
exports.responderPergunta = responderPergunta;
//# sourceMappingURL=aiResponder.js.map