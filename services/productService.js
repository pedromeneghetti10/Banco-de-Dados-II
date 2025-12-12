module.exports = {
  listProducts: (req, res) => {
    res.send({ message: 'Listando produtos...' });
  },
  createProduct: (req, res) => {
    res.send({ message: 'Produto criado!' });
  }
};