const sqlite3 = require('sqlite3').verbose();

// Conecta ao seu banco de dados atual
const db = new sqlite3.Database('./estoque.db');

const pneusAgricolas = [
    // --- COLHEITADEIRAS (Ex: John Deere S790, Case 250) ---
    { marca: "Michelin", modelo: "CerexBib (Dianteiro)", medida: "800/65R32", preco: 14500.00, estoque: 8, imagem: "" },
    { marca: "Trelleborg", modelo: "TM2000 (Dianteiro Alta Flutuação)", medida: "900/60R32", preco: 16200.00, estoque: 4, imagem: "" },
    { marca: "Goodyear", modelo: "Optitrac (Traseiro)", medida: "600/65R28", preco: 6800.00, estoque: 6, imagem: "" },
    { marca: "Firestone", modelo: "Radial All Traction", medida: "520/85R42", preco: 9500.00, estoque: 10, imagem: "" },

    // --- TRATORES DE GRANDE E MÉDIO PORTE ---
    { marca: "BKT", modelo: "Agrimax RT 855", medida: "710/70R42", preco: 11200.00, estoque: 12, imagem: "" },
    { marca: "Michelin", modelo: "Agribib", medida: "18.4-34", preco: 5100.00, estoque: 20, imagem: "" },
    { marca: "Pirelli", modelo: "PHP", medida: "14.9-24", preco: 3200.00, estoque: 16, imagem: "" },
    { marca: "Firestone", modelo: "Super All Traction", medida: "20.8-38", preco: 7400.00, estoque: 8, imagem: "" },

    // --- PLANTADEIRAS E IMPLEMENTOS ---
    { marca: "BKT", modelo: "AW 708 (Alta capacidade)", medida: "400/60-15.5", preco: 1850.00, estoque: 30, imagem: "" },
    { marca: "Goodyear", modelo: "Super Rib", medida: "11L-15", preco: 950.00, estoque: 40, imagem: "" },
    { marca: "Magion", modelo: "Implemento", medida: "9.00-16", preco: 880.00, estoque: 24, imagem: "" },
    { marca: "Trelleborg", modelo: "Twin Implement", medida: "500/50-17", preco: 2600.00, estoque: 14, imagem: "" }
];

console.log("Limpando banco antigo e inserindo pneus...");

db.serialize(() => {
    // 1. Apaga a tabela velha se ela existir
    db.run("DROP TABLE IF EXISTS pneus");

    // 2. Cria a tabela nova e atualizada com a coluna 'imagem'
    db.run(`CREATE TABLE pneus (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        marca TEXT, 
        modelo TEXT, 
        medida TEXT, 
        preco REAL, 
        estoque INTEGER,
        imagem TEXT
    )`);

    // 3. Prepara o comando de inserção
    const stmt = db.prepare("INSERT INTO pneus (marca, modelo, medida, preco, estoque, imagem) VALUES (?, ?, ?, ?, ?, ?)");
    
    // 4. Roda um por um
    pneusAgricolas.forEach(pneu => {
        stmt.run(pneu.marca, pneu.modelo, pneu.medida, pneu.preco, pneu.estoque, pneu.imagem);
    });
    
    stmt.finalize();
    console.log("✅ Sucesso! A tabela foi corrigida e 12 pneus agrícolas foram adicionados ao estoque.");
});

db.close();