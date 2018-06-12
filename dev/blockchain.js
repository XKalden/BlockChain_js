// Crypto Hash Algorithm
const sha256 = require('sha256');

// connecting LocalHost to BlockChain
const currentNodeUrl = process.argv[3];
const uuid = require('uuid/v1');


// Constructor for all Blocks
function Blockchain(){
    this.chain = [];
    this.pendingTransactions = [];

    // Genesis Block
    this.createNewBlock(100, '0', '0');

    // Current Network
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

}   

// Creating block prototype
Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce,
        hash: hash,
        previousBlockHash
    };

    // empty transaction and push to chain
    this.pendingTransactions = [];
    this.chain.push(newBlock);
    return newBlock;
}

// Prototype get Last block
Blockchain.prototype.getLastBlock = function(){
    return this.chain[this.chain.length -1];
}

// Create new Transaction
Blockchain.prototype.createNewTransaction = function(amount, sender, recipient){
    const newTransaction = {
        amount,
        sender,
        recipient,
        transactionId: uuid().split('-').join('')
    };

    return newTransaction;

    // this.pendingTransactions.push(newTransaction);

    // return this.getLastBlock()['index'] + 1;
};

// Add Transaction to pendingTransaction
Blockchain.prototype.addTransactionToPendingTransactions = function(transactionObj){
    this.pendingTransactions.push(transactionObj);
    return this.getLastBlock()['index'] + 1;

} 

// convert Block to Hash values 
Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce){
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
}

// Must be vaild inorder to push to block Chain (hash# start 0000)
Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData){
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000'){
        nonce++;
        hash = this.hashBlock(previousBlockHash,currentBlockData, nonce);
    }

    return nonce;
}



module.exports = Blockchain;