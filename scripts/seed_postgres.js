require('dotenv').config();
const pool = require('../database/postgres');

async function seed() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS clientes (
      id SERIAL PRIMARY KEY,
      cpf VARCHAR(20) UNIQUE,
      nome TEXT,
      endereco TEXT,
      cidade TEXT,
      uf TEXT,
      email TEXT
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      produto TEXT,
      valor NUMERIC,
      quantidade INT,
      tipo TEXT
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS compras (
      id SERIAL PRIMARY KEY,
      id_produto INT REFERENCES produtos(id),
      data TIMESTAMP,
      id_cliente INT REFERENCES clientes(id)
    )`);

    // Clear existing data to keep seed idempotent
    await pool.query('TRUNCATE compras, produtos, clientes RESTART IDENTITY CASCADE');

    // Insert sample clients (more clients, ids will be 1..)
    const clients = [
      ['11111111111','Alice','Rua A','CidadeX','SC','alice@example.com'],
      ['22222222222','Bob','Rua B','CidadeY','SC','bob@example.com'],
      ['33333333333','Carol','Rua C','CidadeX','SC','carol@example.com'],
      ['44444444444','Dave','Rua D','CidadeZ','SC','dave@example.com'],
      ['55555555555','Eva','Rua E','CidadeZ','SC','eva@example.com'],
      ['66666666666','Frank','Rua F','CidadeY','SC','frank@example.com'],
      ['77777777777','Gina','Rua G','CidadeX','SC','gina@example.com'],
      ['88888888888','Hugo','Rua H','CidadeW','SC','hugo@example.com']
    ];

    for (const c of clients) {
      await pool.query('INSERT INTO clientes(cpf,nome,endereco,cidade,uf,email) VALUES($1,$2,$3,$4,$5,$6)', c);
    }

    // Insert sample products (more variety)
    const products = [
      ['Notebook', 3500, 10, 'eletronico'],
      ['Fone', 150, 20, 'acessorio'],
      ['Cadeira', 450, 5, 'moveis'],
      ['Mouse', 60, 50, 'acessorio'],
      ['Tablet', 1200, 8, 'eletronico'],
      ['Teclado', 120, 30, 'acessorio']
    ];
    for (const p of products) {
      await pool.query('INSERT INTO produtos(produto,valor,quantidade,tipo) VALUES($1,$2,$3,$4)', p);
    }

    // Insert purchases (by client id referencing inserted order) — varied so recommendations appear
    // product ids: 1=Notebook,2=Fone,3=Cadeira,4=Mouse,5=Tablet,6=Teclado
    await pool.query("INSERT INTO compras(id_produto,data,id_cliente) VALUES \
      (1,NOW(),1),(4,NOW(),1),(5,NOW(),1),\
      (2,NOW(),2),(1,NOW(),2),\
      (3,NOW(),3),\
      (6,NOW(),4),(2,NOW(),4),\
      (4,NOW(),5),(2,NOW(),5),\
      (5,NOW(),6),(6,NOW(),6),(1,NOW(),6),\
      (2,NOW(),7),\
      (3,NOW(),8)");

    console.log('Postgres seed completed');
  } catch (err) {
    console.error('Postgres seed error:', err.message || err);
  }
}

module.exports = seed;
