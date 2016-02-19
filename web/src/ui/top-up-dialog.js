var async = require('async');
var ethTx = require('ethereumjs-tx');
var util = require('../util');

var dialog = {
  init: function(app, $el) {
    this.app = app;
    this.$el = $el;
    this.$value = $el.find('input[name=value]');
    $el.find('[data-name=topUp]').click(this.topUp.bind(this));
    return this;
  },
  show: function() {
    this.$el.modal('show');
  },
  topUp: function() {
    var value = this.$value.val();

    async.parallel({
      nonce: this.app.web3.eth.getTransactionCount.bind(this.app.web3.eth, this.app.account.address),
      gasPrice: this.app.web3.eth.getGasPrice.bind(this.app.web3.eth)
    }, (function(err, results) {
      if (err) return console.error(err);
      
      var tx = new ethTx({
        to: this.app.wallet.address,
        nonce: results.nonce,
        gasLimit: '0x10000',
        gasPrice: '0x' + results.gasPrice.toString(16),
        value: parseInt(value, 10)
      });
      tx.sign(new Buffer(this.app.account.pkey.substr(2), 'hex'));
      
      this.app.web3.eth.sendRawTransaction('0x' + tx.serialize().toString('hex'), (function(err, txHash) {
        if (err) return console.error(err);
        
        this.$el.modal('hide');
        
        util.waitForReceipt(this.app.web3, txHash, (function(err, receipt) {
          if (err) return console.error(err);
          this.app.emit('accountUpdated');
          this.app.emit('walletUpdated');
        }).bind(this));
      }).bind(this));
    }).bind(this));
  }
};

module.exports = dialog;