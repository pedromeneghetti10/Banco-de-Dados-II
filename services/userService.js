module.exports = {
  listUsers: (req, res) => {
    res.send({ message: 'Listando usuários...' });
  },
  createUser: (req, res) => {
    res.send({ message: 'Usuário criado!' });
  }
};