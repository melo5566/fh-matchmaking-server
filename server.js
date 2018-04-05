var express = require('express');
var session = require('express-session');
var path = require('path');

var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({'region': 'us-west-2'});

var bodyParser = require('body-parser');
var app = express();


var HOST_TABLE_NAME = "Host";
var CASE_WORKER_TABLE_NAME = "CaseWorker";
var RESIDENT_TABLE_NAME = "Resident";


//file upload
var multer  = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './www/images/')
    },
    filename: function (req, file, cb) {
        // cb(null, file.originalname+ '-' + Date.now()+'.jpg')
        cb(null, file.originalname)
    }
});
var upload = multer({ storage: storage });





var router = express.Router();
router.use(function(req, res, next) {
    console.log('Start...');
    next();
});

app.use(session({
    secret: 'a29262241',
    cookie: {maxAge: 60 * 1000 * 30}
}));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/www')));

router.route('/multer')
	// .post(upload.single('file'))
	.post(function(req, res){
		var formData = req.body;
		console.log(formData);
	})

var getResidents = function() {
	var params = {
	  Key: {
	   "email": {S: "aaabbb@gmail.com" }, 
	   "password": {S: "123456"}
	  }, 
	  TableName: "Resident"
	};

	dynamodb.getItem(params, function(err, data) {
		if (err) throw err; // an error occurred
		   	console.log(data["Items"]);
		});	
}
var putCaseWorker = function() {
	var params = {
		Item: {
			"first-name": { S: "Peter" }, 
			"last-name": { S: "Wu" }, 
			"phone": { S: "7346660000" },
			"email": { S: "5566@gmail.com" },
			"password": { S: "123456" },
			"agency": {S: "Amazon"},
			"residents": {SS: ["aaa@gmail.com", "bbb@hotmail.com"]}
		}, 
		ReturnConsumedCapacity: "TOTAL", 
		TableName: CASE_WORKER_TABLE_NAME
	};

	dynamodb.putItem(params, function(err, data) {
		if (err) throw err;
		else console.log("created");
	});
}
var caseWorkerLogin = function() {
	var params = {
		Key: {
	   		"email": {S: "aaabbb@gmail.com" }, 
	   		"password": {S: "123456"}
	  	}, 
	  	TableName: CASE_WORKER_TABLE_NAME
	}
	dynamodb.getItem(params, function(err, data) {
		if (err) throw err;
		console.log(data["Item"]);
	})
}

var findCaseWorker = function() {
	var params = {
		ExpressionAttributeValues: {
			":e": { S: "aaabbb@gmail.com" },
		   	":p": { S: "123456" }
		}, 
		FilterExpression: "email = :e and password = :p",
		TableName: "CaseWorker"
	};
	dynamodb.scan(params, function(err, data) {
		if (err) throw err; // an error occurred
		console.log(data["Items"]);
	});
}
// putCaseWorker();
// getResidents();
// caseWorkerLogin();
findCaseWorker();



router.route('/caseWorker/login')
	.get(function(req, res) {
		var params = {
			Key: {
		   		"email": {S: req.body.email }, 
		   		"password": {S: req.body.password}
		  	}, 
		  	TableName: CASE_WORKER_TABLE_NAME
		};
		dynamodb.getItem(params, function(err, data) {
			if (err) throw err;
			res.send(data["Item"])
		});
	})

router.route('/host/login')
	.get(function(req, res) {
		var params = {
			Key: {
		   		"email": {S: req.body.email }, 
		   		"password": {S: req.body.password}
		  	}, 
		  	TableName: HOST_TABLE_NAME
		};
		dynamodb.getItem(params, function(err, data) {
			if (err) throw err;
			res.send(data["Item"])
		});
	})

router.route('/caseWorker')
	//Get all case workers
	.get(function(req, res) {
		dynamodb.scan({TableName: CASE_WORKER_TABLE_NAME}, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		res.send(data["Items"]);
	   	});
    })
    //Add or update case worker
	.put(function(req, res) {
		var params = {
			Item: {
			    "first-name": { S: req.body.fname }, 
			    "last-name": { S: req.body.lname }, 
			    "phone": { S: req.body.phone },
			    "email": { S: req.body.email },
			    "password": { S: req.body.password },
			    "agency": {S: req.body.agency },
			    "residents": {SS: req.body.residents }
			}, 
			ReturnConsumedCapacity: "TOTAL", 
			TableName: RESIDENT_TABLE_NAME
		};

		dynamodb.putItem(params, function(err, data) {
   			if (err) throw err;
   			else res.send('created');
 		});
	})

router.route('/resident/:id')
	.get(function(req, res) {
		console.log(req.session.loginUser);
		var params = {
			Key: {"id": {N: req.params.id} },
		  	TableName: RESIDENT_TABLE_NAME
		};
		dynamodb.getItem(params, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		console.log(data);
	   		res.send(data["Item"]);
	   	});
    })

router.route('/resident/login')
	.get(function(req, res) {
		console.log(req.session.loginUser);
		var params = {
			Key: {
				"email": {S: req.body.email}, 
				"password": {S: req.body.password} 
			},
		  	TableName: RESIDENT_TABLE_NAME
		};
		dynamodb.getItem(params, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		console.log(data);
	   		res.send(data["Item"]);
	   	});
    })

router.route('/host/login')
	.get(function(req, res) {
		console.log(req.session.loginUser);
		var params = {
			Key: {
				"email": {S: req.body.email}, 
				"password": {S: req.body.password} 
			},
		  	TableName: HOST_TABLE_NAME
		};
		dynamodb.getItem(params, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		console.log(data);
	   		res.send(data["Item"]);
	   	});
    })

router.route('/user')
	.get(function(req, res) {
		dynamodb.scan({TableName: CASE_WORKER_TABLE_NAME}, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		res.send(data["Items"]);
	   	});
    })

router.route('/user/:id')
	.get(function(req, res) {
		var params = {
			Key: {"id": {N: req.params.id} },
		  	TableName: "FH-Host"
		};
		console.log(params);
		dynamodb.getItem(params, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		console.log(data);
	   		res.send(data["Item"]);
	   	});
    })

//Will change it to use getItem
router.route('/caseWorker/login/:email/:password')
	.get(function(req, res) {
		var params = {
			ExpressionAttributeValues: {
		   		":e": { S: req.params.email },
		   		":p": { S: req.params.password }
		  	}, 
		  	FilterExpression: "email = :e and password = :p",
		  	TableName: "CaseWorker"
		};
		dynamodb.scan(params, function(err, data) {
	   		if (err) throw err; // an error occurred
	   		req.session.loginUser = data["Items"][0];
	   		console.log(data["Items"]);
	   		res.send(data["Items"]);
	   	});
    })

router.route('/logout')
	.delete(function(req, res) {
		req.session.destroy();
		res.send("logout");
    })



app.use('/', router);

app.use(function(req, res){
	res.send("404");
});

app.listen(8800, function() {
	console.log('Express App started');
});
