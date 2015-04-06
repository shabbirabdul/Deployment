var http      = require('http');
var httpProxy = require('http-proxy');
var exec = require('child_process').exec;
var request = require("request");
var redis = require('redis')

var GREEN = 'http://localhost:3000';
var BLUE  = 'http://localhost:3001';
var TARGET = BLUE;


var blue_redis = redis.createClient(6379, '127.0.0.1', {}) // client 1
var green_redis = redis.createClient(6380, '127.0.0.1', {}) //client 2

var flag = process.argv.slice(2)[0];

var infrastructure ={
  setup: function(){
    var options = {};
    var proxy   = httpProxy.createProxyServer(options);
    var server  = http.createServer(function(req, res){
      console.log(req.url);
      if(req.url == '/switch'){
        if(TARGET == BLUE){
          TARGET=GREEN //toggle
          console.log('Green Server');
          blue_redis.lrange("images",0,-1,function(err,value){
            value.forEach(function(data){
            green_redis.lpush("images",data);
            });
          });
        }
        else{
          TARGET = BLUE //toggle
          console.log('Blue Server');
          green_redis.lrange("images",0,-1,function(err,value){
            value.forEach(function(data){
            blue_redis.lpush("images",data);
            });
          });
        }
          res.statusCode=200;
          res.write('switch over');
          res.end();
      }
      else{
              if(flag == 1){
		            if(req.url == '/upload'){
                    var route_to = '';
                    if(TARGET == BLUE){
                      route_to = GREEN
                    }
                    else{
                      route_to = BLUE
                    }
                    req.pipe(request.post(route_to+'/upload'));
                    proxy.web( req, res, {target: TARGET } );
              	  }
		          }
              else{
                proxy.web( req, res, {target: TARGET } );
              }
      }

    });
    server.listen(8181);

    // Launch green slice
    exec('forever start blue-www/server1.js 3001 6379');
    console.log("blue slice");

    // Launch blue slice
    exec('forever start green-www/server1.js 3000 6380');
    console.log("green slice");

//setTimeout
//var options =
//{
//  url: "http://localhost:8080",
//};
//request(options, function (error, res, body) {

  },

  teardown: function()
  {
    exec('forever stopall', function()
    {
      console.log("infrastructure shutdown");
      process.exit();
    });
  },
}

infrastructure.setup();

// Make sure to clean up.
process.on('exit', function(){infrastructure.teardown();} );
process.on('SIGINT', function(){infrastructure.teardown();} );
process.on('uncaughtException', function(err){
  console.log(err);
  infrastructure.teardown();} );
