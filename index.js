'use strict';

var Hapi = require('hapi');
var nconf = require('nconf');
var fs = require('fs');
var RevisitValidator = require('revisit-validator');
var rv = new RevisitValidator();

nconf.argv().env().file({ file: 'local.json' });

var options = {
  views: {
    engines: {
      jade: require('jade')
    },
    isCached: process.env.node === 'production',
    path: __dirname + '/views',
    compileOptions: {
      pretty: true
    }
  }
};

var objSize = function (obj) {
  var size = 0;
  var key;

  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      size ++;
    }
  }

  return size;
};

var server = Hapi.createServer(nconf.get('domain'), nconf.get('port'), options);

var routes = [
  {
    method: 'GET',
    path: '/',
    config: {
      handler: home
    }
  },
  {
    method: 'POST',
    path: '/',
    config: {
      handler: validate
    }
  }
];

server.route(routes);

server.route({
  path: '/{path*}',
  method: "GET",
  handler: {
    directory: {
      path: './public',
      listing: false,
      index: false
    }
  }
});

server.start();

function home(request, reply) {
  reply.view('index');
}

function validate(request, reply) {
  var buffer = fs.readFileSync(__dirname + '/public/images/omg.png');

  rv.url = request.payload.url;
  rv.content = {
    content: {
      data: 'data:image/png;base64,' + buffer.toString('base64')
    },
    meta: {
      audio: {}
    }
  };

  rv.validate(function () {
    reply.view('index', {
      hasErrors: !!objSize(rv.errors),
      errors: rv.errors
    });
  });
};
