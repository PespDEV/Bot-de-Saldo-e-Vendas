const mongoose = require('mongoose');

const cupomsSchema = new mongoose.Schema({
    server_id: String,
    nome: String,
    desconto: Number,
});

module.exports.Cupom = mongoose.model('cupom', cupomsSchema);
