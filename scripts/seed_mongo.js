require('dotenv').config();
const mongoose = require('../database/mongo');

async function seed() {
  try {
    const coll = mongoose.connection.collection('profiles');
    await coll.deleteMany({});
    await coll.insertMany([
      { cpf: '11111111111', interests: ['eletronico', 'games'] },
      { cpf: '22222222222', interests: ['musica', 'acessorios'] },
      { cpf: '33333333333', interests: ['moveis', 'casa'] },
      { cpf: '44444444444', interests: ['esportes', 'outdoor'] },
      { cpf: '55555555555', interests: ['musica','acessorios'] },
      { cpf: '66666666666', interests: ['eletronico','computacao'] },
      { cpf: '77777777777', interests: ['moveis'] },
      { cpf: '88888888888', interests: ['casa','decor'] }
    ]);
    console.log('Mongo seed completed');
  } catch (err) {
    console.error('Mongo seed error:', err.message || err);
  }
}

module.exports = seed;
