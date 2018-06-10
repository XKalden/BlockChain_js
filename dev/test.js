const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();





console.log(bitcoin.proofOfWork(previousBlockHash,currentBlockData)); //4454
