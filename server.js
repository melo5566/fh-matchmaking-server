var express = require('express');
var session = require('express-session');
var path = require('path');

//AWS
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({'region': 'us-west-2'});

var bodyParser = require('body-parser');
var app = express();

var router = express.Router();
router.use(function(req, res, next) {
    console.log('Start...');
    next();
});

var word = require('./word.js');

app.use(session({
    secret: 'a29262241',
    cookie: {maxAge: 60 * 1000 * 30}
}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/www')));

router.route('/caseWorker/residents')
	//get residents by case worker
	.get(function(req, res) {
		var params = {
			ExpressionAttributeValues: {
				":cw": { S: req.body.email }
			}, 
			FilterExpression: word.caseWorker + " = :cw",
			TableName: word.RESIDENT_TABLE_NAME
		};

		dynamodb.scan(params, function(err, data) {
			if (err) throw err; // an error occurred
		   	res.send(data["Items"])
		});
	})

router.route('/caseWorker/login')
	.get(function(req, res) {
		var params = {
			Key: {
		   		"email": {S: req.body.email }, 
		   		"password": {S: req.body.password}
		  	}, 
		  	TableName: word.CASE_WORKER_TABLE_NAME
		};
		dynamodb.getItem(params, function(err, data) {
			if (err) throw err;
			var caseWorker = data["Item"]
			req.session.loginUser = caseWorker;
			res.send(caseWorker)
		});
	})

router.route('/caseWorker')
	//Get all case workers
	.get(function(req, res) {
		dynamodb.scan({TableName: word.CASE_WORKER_TABLE_NAME}, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		res.send(data["Items"]);
	   	});
    })
    //Add or update case worker
	.put(function(req, res) {
		var params = {
			Item: {
			    "first_name": { S: req.body.fname }, 
			    "last_name": { S: req.body.lname }, 
			    "phone": { S: req.body.phone },
			    "email": { S: req.body.email },
			    "password": { S: req.body.password },
			    "agency": {S: req.body.agency },
			    "residents": {SS: req.body.residents }
			}, 
			ReturnConsumedCapacity: word.total, 
			TableName: word.CASE_WORKER_TABLE_NAME
		};

		dynamodb.putItem(params, function(err, data) {
   			if (err) throw err;
   			else res.send(word.succeeded);
 		});
	})

router.route('/resident')
	//Get all residents
	.get(function(req, res) {
		dynamodb.scan({TableName: word.RESIDENT_TABLE_NAME}, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		res.send(data["Items"]);
	   	});
    })
    //Add or update case worker
	.put(function(req, res) {
		var params = {
			Item: {
			    "first_name": { S: req.body.fname }, 
			    "last_name": { S: req.body.lname }, 
			    "email": { S: req.body.email },
			    "case_worker": {SS: req.body.caseWorker }
			}, 
			ReturnConsumedCapacity: word.total, 
			TableName: RESIDENT_TABLE_NAME
		};

		dynamodb.putItem(params, function(err, data) {
   			if (err) throw err;
   			else res.send(word.succeeded);
 		});
	})

router.route('/resident/:email')
	.get(function(req, res) {
		var params = {
			Key: {"email": { S: req.params.email} },
		  	TableName: word.RESIDENT_TABLE_NAME
		};
		dynamodb.getItem(params, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		console.log(data);
	   		res.send(data["Item"]);
	   	});
    })

router.route('/host/login')
	.get(function(req, res) {
		var params = {
			Key: {
				"email": {S: req.body.email}, 
				"password": {S: req.body.password} 
			},
		  	TableName: word.HOST_TABLE_NAME
		};
		dynamodb.getItem(params, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		var host = data["Item"];
	   		req.session.loginUser = host;
	   		res.send(host);
	   	});
    })

router.route('/host')
	//Get all hosts
	.get(function(req, res) {
		dynamodb.scan({TableName: word.HOST_TABLE_NAME}, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		res.send(data["iItems"]);
	   	});
    })
    //Add or update case worker
	.put(function(req, res) {
		var params = {
			Item: {
			    "first_name": { S: req.body.fname }, 
			    "last_name": { S: req.body.lname }, 
			    "email": { S: req.body.email }
			}, 
			ReturnConsumedCapacity: word.total, 
			TableName: word.HOST_TABLE_NAME
		};

		dynamodb.putItem(params, function(err, data) {
   			if (err) throw err;
   			else res.send(word.succeeded);
 		});
	})

router.route('/logout')
	.delete(function(req, res) {
		req.session.destroy();
		res.send(word.logout);
    })

app.use('/', router);
app.use(function(req, res){
	res.send("404");
});

app.listen(8000, function() {
	console.log('Express App started');
});
