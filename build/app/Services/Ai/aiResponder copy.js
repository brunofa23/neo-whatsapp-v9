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
const Application_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Application"));
const fs_1 = __importDefault(require("fs"));
const openai = new openai_1.OpenAI({
    apiKey: Env_1.default.get('OPENAI_API_KEY'),
});
async function criarGerenciador(perguntas) {
    const modelPath = Application_1.default.makePath(`app/Services/Ai/model.nlp`);
    const manager = new node_nlp_1.NlpManager({ languages: ['pt'], forceNER: true, nlu: { log: false } });
    if (fs_1.default.existsSync(modelPath)) {
        await manager.load(modelPath);
        return manager;
    }
    perguntas.forEach((item, index) => {
        manager.addDocument('pt', item.ask, `pergunta.${index}`);
        manager.addAnswer('pt', `pergunta.${index}`, item.answer);
    });
    await manager.train();
    await manager.save(modelPath);
    return manager;
}
async function fallbackParaIA(perguntaUsuario, perguntas, informationContext) {
    try {
        const similaridades = perguntas.map((pergunta, i) => ({
            pergunta,
            resposta: query[i].answer,
            score: string_similarity_1.default.compareTwoStrings(perguntaUsuario, pergunta),
        }));
        const topSimilares = similaridades
            .sort((a, b) => b.score - a.score)
            .slice(0, 2);
        const contexto = topSimilares
            .map((p) => `Q: ${p.pergunta}\nA: ${p.resposta}`)
            .join('\n\n');
        const messages = [
            {
                role: 'system',
                content: `Você é um bot de call center de um hospital chamada Iris, e só pode responder com base nas perguntas e respostas abaixo.
                  Se a pergunta do usuário não estiver claramente presente ou relacionada diga "Desculpe, não tenho essa resposta, melhor ligar para a nossa central.".
                  Se alguém te tratar de forma hostil ou com palavras indevidas diga "Desculpe, sou apenas uma máquina e ainda estou aprendendo!".
                  Nunca confirme uma marcação ou cancelamento de agendamento.
                  Responda de forma clara, objetiva e educada.
                  Se tiver o nome chame-o apenas pelo primeiro nome.
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
        const response = await axios_1.default.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages,
            temperature: 0.5,
            max_tokens: 500,
        }, {
            headers: {
                Authorization: `Bearer ${Env_1.default.get('GROQ_API_KEY')}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data.choices?.[0]?.message?.content?.trim() || 'Desculpe, não entendi sua pergunta.';
    }
    catch (error) {
        console.error('Erro no fallback com IA:', error);
        return 'Desculpe, houve um erro ao tentar entender sua pergunta.';
    }
}
async function responderPergunta(perguntaUsuario, informationContext = '') {
    let query = [];
    try {
        query = await Faq_1.default.query().select('ask', 'answer');
    }
    catch (error) {
        console.error('Erro ao consultar FAQs:', error);
        return 'Desculpe, houve um erro ao buscar as perguntas frequentes.';
    }
    const perguntas = query.map((item) => item.ask);
    let manager;
    try {
        manager = await criarGerenciador(query);
    }
    catch (error) {
        console.error('Erro ao treinar NLP:', error);
        return 'Desculpe, não consegui processar sua pergunta no momento.';
    }
    let resultado;
    try {
        resultado = await manager.process('pt', perguntaUsuario);
    }
    catch (error) {
        console.error('Erro ao processar pergunta com NLP:', error);
        return 'Desculpe, houve um erro ao tentar entender sua pergunta.';
    }
    const match = string_similarity_1.default.findBestMatch(perguntaUsuario, perguntas);
    const similaridade = match.bestMatch.rating;
    const perguntaMaisParecida = match.bestMatch.target;
    const indexMaisParecido = perguntas.findIndex((p) => p === perguntaMaisParecida);
    const respostaMaisParecida = query[indexMaisParecido]?.answer;
    if (similaridade >= 0.7 && respostaMaisParecida) {
        return respostaMaisParecida;
    }
    return await fallbackParaIA(perguntaUsuario, query, informationContext);
}
exports.responderPergunta = responderPergunta;
//# sourceMappingURL=aiResponder%20copy.js.map