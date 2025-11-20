// server.js (Corrigido e com CORS)

import "dotenv/config"; // <-- Importa e configura o dotenv para carregar as variáveis de ambiente
import { GoogleGenAI } from "@google/genai";
import express from "express";
import cors from "cors"; // <-- Importar o CORS
import fs from "fs/promises"; // <-- Importar o módulo File System (Promises)

// 1. Configuração da Porta
const PORT = 3000;

// 2. Inicialização do Express
const app = express();

// Configuração do CORS: Permite que o frontend acesse o backend
app.use(cors()); // <-- Usar o CORS AQUI
app.use(express.json());

const DATA_FILE_PATH = "./data.json";

/**
 * Função para salvar um novo item no arquivo data.json
 * @param {object} novoItem - O objeto a ser adicionado ao JSON.
 */
async function salvarEmJson(novoItem) {
  try {
    // 1. Lê o conteúdo atual do arquivo
    const conteudoAtual = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const dados = JSON.parse(conteudoAtual);

    // 2. Adiciona o novo item ao array de dados
    dados.push(novoItem);

    // 3. Escreve o array atualizado de volta no arquivo, com formatação
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(dados, null, 2), "utf-8");
  } catch (error) {
    console.error("❌ Erro ao salvar o item no arquivo JSON:", error);
  }
}

// 3. Inicialização do Google Gen AI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY, // <-- Pega a chave do arquivo .env
});

// Rota de Busca com a IA
app.post("/api/buscar-ia", async (req, res) => {
  const termo = req.body.termo || "linguagem de programação";
  // O prompt completo é importante para garantir a formatação JSON
  const prompt = `Consulte sobre a tecnologia chamada "${termo}". Retorne sua resposta EXATAMENTE no formato JSON contendo as chaves "nome", "ano" (o ano de criação como um número), "descricao" (uma descrição concisa de até 3 frases) e "link" (o link para o site oficial). Se não souber ou não for uma tecnologia, retorne um JSON com a chave "erro".`;

  try {
    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // 1. Tentar obter o JSON limpo
    const iaResponseText = aiResponse.text.replace(/```json|```/g, "").trim();

    let iaResult;
    try {
      // 2. Tentar analisar o JSON
      iaResult = JSON.parse(iaResponseText);
    } catch (parseError) {
      // 3. Se o JSON.parse falhar, tratar como erro de formatação da IA
      console.error("❌ Erro de Parsing JSON da IA:", parseError.message);
      console.error("Texto Bruto da IA:", iaResponseText);
      // Retorna um JSON de erro para o frontend se a formatação falhar
      return res.status(500).json({
        erro: "A IA retornou um formato inválido. Tente novamente.",
        detalhe_ia: iaResponseText,
      });
    }

    // Se a IA retornou um resultado válido, salva no data.json antes de responder
    if (!iaResult.erro) {
      await salvarEmJson(iaResult);
      exibirResultados([iaResult], true);
    }

    // 4. Se tudo correr bem, retorna o resultado
    res.json(iaResult);
  } catch (error) {
    console.error("❌ Erro Geral na Chamada da IA:", error);
    // Retorna um status de erro para o frontend
    res.status(500).json({
      erro: "Erro interno do servidor ao comunicar com a IA.",
      detalhe: error.message,
    });
  }
});

// 4. Inicia o Servidor na Porta 3000
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(
    "⚠️ Lembre-se de configurar a variável de ambiente GEMINI_API_KEY."
  );
});
// FIM DO ARQUIVO (Sem chaves extras)
