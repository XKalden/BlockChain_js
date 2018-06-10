var express = require('express');
var app = express();


app.get('/blockChain', function(req, res){
    res.send('Hello word');
});

app.post('/transaction', function(req, res){

});

app.get('/mine', function(req,res){

}); 

app.listen(3000, function(){
    console.log("Port 3000")
});