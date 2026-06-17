require('dotenv').config(); // Carrega as variáveis do arquivo .env
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Puxa a chave de forma segura e oculta
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database('./estoque.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS pneus (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        marca TEXT, 
        modelo TEXT, 
        medida TEXT, 
        preco REAL, 
        estoque INTEGER,
        imagem TEXT
    )`);
});

// -- ROTAS DE PRODUTOS E PEDIDOS --
app.get('/api/pneus', (req, res) => {
    db.all("SELECT * FROM pneus", [], (err, rows) => res.json(rows));
});

app.post('/api/pneus', (req, res) => {
    const { marca, modelo, medida, preco, estoque, imagem } = req.body;
    db.run("INSERT INTO pneus (marca, modelo, medida, preco, estoque, imagem) VALUES (?, ?, ?, ?, ?, ?)", [marca, modelo, medida, preco, estoque, imagem], function() { res.json({ success: true, id: this.lastID }); });
});

app.put('/api/pneus/:id', (req, res) => {
    const { marca, modelo, medida, preco, estoque, imagem } = req.body;
    db.run("UPDATE pneus SET marca = ?, modelo = ?, medida = ?, preco = ?, estoque = ?, imagem = ? WHERE id = ?", [marca, modelo, medida, preco, estoque, imagem, req.params.id], function() { res.json({ success: true }); });
});

app.delete('/api/pneus/:id', (req, res) => {
    db.run("DELETE FROM pneus WHERE id = ?", req.params.id, function() { res.json({ success: true }); });
});

app.post('/api/pedidos', (req, res) => {
    const { pneuId, quantidade } = req.body;
    db.run("UPDATE pneus SET estoque = estoque - ? WHERE id = ? AND estoque >= ?", [quantidade, pneuId, quantidade], function() {
        this.changes > 0 ? res.json({ success: true }) : res.status(400).json({ success: false, message: "Estoque insuficiente." });
    });
});

// -- ROTA DO CHATBOT COM INTELIGÊNCIA ARTIFICIAL --
app.post('/api/chat', async (req, res) => {
    const { mensagemUsuario } = req.body;

    db.all("SELECT marca, modelo, medida, preco, estoque FROM pneus WHERE estoque > 0", [], async (err, estoqueAtual) => {
        if (err) return res.status(500).json({ error: err.message });

        try {
            const modeloIA = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const prompt = `
            Você é um assistente virtual especialista em máquinas agrícolas da loja Agroforte Pneus e Rodas.
            Um cliente te perguntou: "${mensagemUsuario}"
            
            Aqui está a lista de pneus que temos EM ESTOQUE HOJE (em formato JSON):
            ${JSON.stringify(estoqueAtual)}

            Sua tarefa:
            1. Entenda qual é a máquina do cliente.
            2. Descubra qual medida de pneu serve nessa máquina (use seu conhecimento geral).
            3. Verifique na nossa lista de estoque se temos um pneu com essa medida.
            4. Responda ao cliente de forma amigável, curta e direta, dizendo se temos ou não o pneu, e o preço.
            `;

            const result = await modeloIA.generateContent(prompt);
            const respostaIA = result.response.text();
            
            res.json({ resposta: respostaIA });
        } catch (error) {
            console.error("Erro na API do Gemini:", error);
            res.status(500).json({ error: "Erro ao falar com a IA." });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}.`));