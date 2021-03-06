const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// get 128-bit data
const uuid = require('uuid/v1');
// get request promise 
const rp = require('request-promise');
const BlockChain = require('./blockchain');

// change Ports base on Package.json 
const port = process.argv[2];


const nodeAddress = uuid().split('-').join('');
const bitcoin = new BlockChain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/blockChain', function(req, res){
    res.send(bitcoin);
});

app.post('/transaction', function(req, res){
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({note: `Transaction will be added in block ${blockIndex}.`});
});

app.post('/transaction/broadcast', function(req,res){
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(data => {
        res.json({note: 'Transaction created and broadbast Successfully'});
    });

});




// mine bitcoin and push mine reward transaction 
app.get('/mine', function(req,res){
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];

    // current Block data
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    };

    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);

    // reward to miner for finding Bitcoin
    // bitcoin.createNewTransaction(12.5, "00", nodeAddress);

    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            url: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock: newBlock},
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });
    Promise.all(requestPromises)
    .then(data => {
        const requestOptions = {
            uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
            method: 'POST',
            body: {
                amount: 12.5,
                sender: "00",
                recipient: nodeAddress
            },
            json: true
        };

        return rp(requestOptions);
    })
    .then(data => {
        res.json({
            note: "New Block mined successfully",
            block: newBlock,
        });
    });
}); 

app.post('/receive-new-block', function(req, res){
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

    if(correctHash && correctIndex){
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];
        res.json({
            note: 'New Block received and accepeted.',
            newBlock: newBlock
        });
    } else {
        res.json({
            note: 'New Block rejected.',
            newBlock: newBlock
        });
    }
});


// register a node and broadcast it. 
app.post('/register-and-broadcast-node', function(req,res){
    const newNodeUrl = req.body.newNodeUrl;
    if(bitcoin.networkNodes.indexOf(newNodeUrl) === -1) bitcoin.networkNodes.push(newNodeUrl);
    
    // broadcast to all Network
    const regNodePromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/register-node',
            method:'POST',
            body: { newNodeUrl: newNodeUrl },
            json: true
        };
        regNodePromises.push(rp(requestOptions));
    });

    Promise.all(regNodePromises)
    .then(data => {
        const bulkRegisterOptions = {
            uri: newNodeUrl + '/register-nodes-bulk',
            method: 'POST',
            body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]},
            json: true
        };
        return rp(bulkRegisterOptions);
    })
    .then(data => {
        res.json({node: 'New node registered with network sucessfull'});
    })
});

// register a node with the network
app.post('/register-node', function(req,res){
    const newNodeUrl = req.body.newNodeUrl;
    const nodePresentCheck = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;
    if(nodePresentCheck && notCurrentNode) bitcoin.networkNodes.push(newNodeUrl);

    res.json({node: 'New node registered successfully.'});
});



// register all node at once (register bunlk node)
app.post('/register-nodes-bulk', function(req,res){
    const allNetworkNodes = req.body.allNetworkNodes;

    allNetworkNodes.forEach(networkNodeUrl => {
        const nodePresentCheck = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
        if(nodePresentCheck && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);
    });

    res.json({ node: 'Bulk registration successful' });

});

app.listen(port, function(){
    console.log(`listening to port ${port}..`)
});