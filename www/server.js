"use strict";
class ApiExporter {
  constructor() {
    this.settings = {};
    this.temp = {};
    this.lib = {};
    this.lib.http = require('http');
    this.lib.https = require('https');
    this.lib.fs = require('fs');
    this.lib.events = new (require('events'));
    this.lib.fileUnitFiler = new (require('fileunit').Filer)('data.json');
    
    this.lib.events.on('eventFileRead', (request, response) => {this.fileRead(request, response);});
    this.lib.events.on('eventApiCall', (request, response) => {this.apiHandler(request, response);});
    this.lib.events.on('eventExport', (request, response) => {this.exportHandler(request, response);});
    this.lib.events.on('eventHttpFail', (response, message) => {this.serverFailHard(response, message);});
    this.lib.events.on('eventHttpSuccessJson', (response, data) => {this.serverReturnJson(response, data);});
    this.lib.events.on('eventHttpData', (response, data) => {this.queryAuthorisationHandler(response, data);});
    
    this.lib.fileUnitFiler.load((readError, fileData) => {this.runAfterLoad(readError, fileData);});
  }
  runAfterLoad(readError, fileData) {
    if(!readError) {
      this.settings = JSON.parse(fileData);
      this.lib.http.createServer((request, response) => {this.serverResponse(request, response)}).listen(this.settings.port);
      this.queryAuthorisation();
    }
    else {
      throw readError;
    };
    return null;
  }
  fileRead(request, response) {
    let append = '';
    if(request.url.substr(-1, 1) === '/') {
      append = 'index.html';
    }
    else if(request.url.indexOf('.') === -1) {
      append = '.html'
    };
    this.lib.fs.readFile(this.settings.wwwPath + request.url + append, (error, fileContents) => {
      if(error) {
        this.lib.events.emit('eventHttpFail', response);
        // throw error;
      }
      else {
        response.writeHead(200);
        response.end(fileContents);
      };
    });
  }
  randomString(length) {
    if(typeof length !== undefined) {
      length = Math.ceil(Math.random() * 20);
    };
    
    let tempRandom = '';
    let characterMap = [
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'x', 'y', 'z'
    ];
    let maxCharacters = characterMap.length - 1;
    
    for(let i = length; i > 0; i -= 1) {
      tempRandom += characterMap[Math.round(Math.random() * maxCharacters)];
    };
    
    return tempRandom;
  }
  timer(action, id) {
    let now = (new Date()).now();
    let tempName = id || '';
    let timeDiff = 0;
    
    if(action === 'set') {
      tempName = this.randomString();
      this.timers[tempName] = now;
    }
    else if(action === 'get') {
      timeDiff = now - this.timers[id];
    };
    
    return {"id": tempName, "timeDiff": timeDiff};
  }
  querySend(method, endpoint, headers, body) {
    //console.log(method, endpoint, headers, body);
    if(headers === undefined) headers = {};
    if(body === undefined) body = '';
    let options = {
      "hostname": "api.trustpilot.com",
      "port": 443,
      "path": endpoint,
      "method": method,
      "headers": headers
    };
    let access = this.lib.https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('error', (error) => {
        this.lib.events.emit('eventHttpFail', response);
      });
      response.on('end', () => {
        this.lib.events.emit('eventHttpData', response, data);
      });
    });
    access.on('error', (error) => {
      this.lib.events.emit('eventHttpFail', error);
    });
    access.end(body);
  }
  queryAuthorisation() {
    this.querySend(
      'POST'
      , '/v1/oauth/oauth-business-users-for-applications/accesstoken'
      //, '/v1/product-reviews/business-units/' + this.settings.businessUnit + '/reviews'
      , {
        "Authorization": "Basic " + (new Buffer(this.settings.apiKey + ':' + this.settings.apiSecret).toString('base64'))
        , "Content-Type": "application/x-www-form-urlencoded"
        , "User-Agent": "rest"
        //, "apikey": this.settings.apiKey
      }
      , 'grant_type=password&username=' + this.settings.username + '&password=' + this.settings.password
    );
  }
  queryAuthorisationHandler(response, data) {
    if(response.client._httpMessage.path === '/v1/oauth/oauth-business-users-for-applications/accesstoken') {
      let json = JSON.parse(data);
      this.temp.accessToken = json.access_token;
      console.log(this.temp.accessToken);
    };
    console.log(data);
  }
  exportHandler(request, response) {
    this.querySend(
      'GET'
      , '/v1/private/product-reviews/business-units/' + this.settings.businessUnit + '/summaries'
      , {
        "Authorization": "Bearer " + this.temp.accessToken
        , "Content-Type": "application/json"
        , "User-Agent": "rest"
      }
    );
    //console.log(this);
    console.log(this.temp);
    /*let options = {
      "hostname": "api.trustpilot.com",
      "port": 443,
      "path": '/v1/product-reviews/business-units/' + this.settings.businessUnit + '/reviews',
      "method": "GET",
      headers: {
        "apikey": this.settings.apiKey
      }
    };
    let access = this.lib.https.request(options, (response) => {
      let data = '';
      console.log('datatatata');
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('error', (error) => {
        this.lib.events.emit('eventHttpFail', response);
      });
      response.on('end', () => {
        console.log(data);
      });
    });
    access.on('error', (e) => {
      console.error(e);
    });
    access.end();*/
  }
  apiHandler(request, response) {
    let data = '';
    request.on('data', (chunk) => {
      data += chunk;
    });
    request.on('error', (error) => {
      this.lib.events.emit('eventHttpFail', response);
    });
    request.on('end', () => {
      if(request.url === '/api/v1/settings') {
        if(request.method === 'GET') {
          this.lib.events.emit('eventHttpSuccessJson', response, this.settings);
        }
        else if(request.method === 'POST') {
          this.settings = JSON.parse(data);
          this.lib.fileUnitFiler.save(JSON.stringify(this.settings));
          this.lib.events.emit('eventHttpSuccessJson', response, {"status": true, "message": "Success"});
        };
      }
      else if(request.url === '/api/v1/export') {
        this.lib.events.emit('eventExport', request, response);
      }
      else {
        this.lib.events.emit('eventHttpFail', response);
      };
    });
  }
  serverReturnJson(response, data) {
    response.writeHead(200, {"Content-Type": "application/json"});
    response.end(JSON.stringify(data));
  }
  serverFailHard(response, message) {
    let reply = 'Page not found';
    reply = (message === '' ? reply : message);
    response.writeHead(404, {"Content-Type": "text/html"});
    response.end(reply);
  }
  serverResponse(request, response) {
    if (request.url.substr(0,4) !== '/api') {
      this.lib.events.emit('eventFileRead', request, response);
    }
    else {
      this.lib.events.emit('eventApiCall', request, response);
    };
  }
};
//exports.ApiExporter = ApiExporter;
let apiExporter = new ApiExporter();