import OpenAI from "openai";

// Garante que a chave existe para evitar erros silenciosos
if (!process.env.OPENAI_API_KEY) {
  throw new Error("A variável de ambiente OPENAI_API_KEY está faltando.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});