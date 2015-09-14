var koa = require('koa');
var render = require('koa-ejs');
var serve = require('koa-static');
var router = require('koa-router')();
var app = koa();
var path = require('path');
var os = require('os');
var fs = require('fs');
var async = require('async');
var parse = require('co-busboy');
var PNG = require('png-js');
var lwip = require('lwip');
var bodyParser = require('koa-bodyparser');
var koaBody = require('koa-body');
var MMCQ = require('./pixelWork')();

render(app, {
  root: path.join(__dirname, 'views'),
  layout: false,
  viewExt: 'ejs',
  cache: false,
  debug: true
});

router.get('/', function *(next) {
    yield this.render('index');
});

router.post('/loadimage', koaBody({
    multipart: true,
    formidable: {
      uploadDir: __dirname + '/uploads',
      keepExtensions : true
    }
  }), function *(next) {
  	var colors = {};
    var file = this.request.body.files.file;
    var self = this;

    function load(cb) {
	    lwip.open(file.path, function (err, image) {
			cb(null, image);
		});
    }

    image = yield load;

    var palette = getPalette(image, 11);

  	this.body = { palette : palette };
  	yield next;
});

app
	.use(router.routes())
	.use(serve(__dirname + '/'));

app.listen(3000);



var getPalette = function(sourceImage, colorCount, quality) {

    if (typeof colorCount === 'undefined') {
        colorCount = 10;
    }
    if (typeof quality === 'undefined' || quality < 1) {
        quality = 10;
    }

    var width = image.width();
    var height = image.height();
    var pixelArray = [];

    for (var px = 0; px <= width - 1; px = px + quality) {
        for (var py = 0; py <= height - 1; py = py + quality) {
            var rgba = image.getPixel(px, py);
            if (!(rgba.r > 250 && rgba.g > 250 && rgba.b > 250)) {
                pixelArray.push([rgba.r, rgba.g, rgba.b]);
            }  
        }       
    } 

    var cmap    = MMCQ.quantize(pixelArray, colorCount);
    var palette = cmap? cmap.palette() : null;

    return palette;
};