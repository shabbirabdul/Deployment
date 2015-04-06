# Data Migration HW4

### Git Hook Setup and Infrastructure.

Created folder structure as follows:

* deploy/
  * blue.git/
  * blue-www/
  * green.git/
  * green-www/

Created green and blue infrastructure:

` var GREEN = 'http://localhost:3000';
 
  var BLUE  = 'http://localhost:3001'; `

Created blue and green redis instances:

` var blue_redis = redis.createClient(6379, '127.0.0.1', {}) // client 1
 
  var green_redis = redis.createClient(6380, '127.0.0.1', {}) //client 2 `


### Switching and Data migration

The traffic is defaulted to BLUE instance: 
`var TARGET = BLUE;`
After that the traffic is toggled between BLUE and GREEN instances alternatively and migrates data.

`
	if(TARGET == BLUE)
  
        {
  
          TARGET=GREEN //toggle

          console.log('Green Server');

          blue_redis.lrange("images",0,-1,function(err,value){

                value.forEach(function(data){

                green_redis.lpush("images",data);
       
                });
  
          });
  
        }
  
        else
  
        {
  
          TARGET = BLUE //toggle
  
          console.log('Switched to Blue Server');
  
          green_redis.lrange("images",0,-1,function(err,value){
  
                value.forEach(function(data){
  
                blue_redis.lpush("images",data);
  
                });
  
          });
  
        }`

### Mirroring

Mirroring will perform the same action on both BLUE and GREEN servers. I have used a flag which when set to 1 will do mirroring, other wise the action is performed on either BLUE or GREEN server.

`  
	if(flag == 1)
  
              {

		if(req.url == '/upload'){
  
                    var route_to = '';
  
                    if(TARGET == BLUE)
  
                    {
  
                      route_to = GREEN
  
                    }
  
                    else
  
                    {
  
                      route_to = BLUE
  
                    }
  
                    req.pipe(request.post(route_to+'/upload'));
  
                    proxy.web( req, res, {target: TARGET } );
  
              	}

		}`


