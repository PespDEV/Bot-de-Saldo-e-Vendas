const mongoose = require('mongoose');

const usersaldoSchema = new mongoose.Schema({
    server_id: String,
    user_id: String,
    email: String,
    saldo: Number,
});

const pagamentosSchema = new mongoose.Schema({
    server_id: String,
    user_id: String,
    canal: String,
    valor: Number,
    data: String,
    pagamento_confirmado: Boolean,
    idpagamento: Number,
    refounded: Boolean,
    logmsg: String
});

const msgsaldoSchema = new mongoose.Schema({
    server_id: String,
    msgurl: String,
});

module.exports.Saldo = mongoose.model('saldo', usersaldoSchema);
module.exports.SaldoPagamento = mongoose.model('saldopagamento', pagamentosSchema);
module.exports.SaldoMsg = mongoose.model('saldomsg', msgsaldoSchema);
