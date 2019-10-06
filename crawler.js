var http = require('http');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var open = require('open');
var URL = require('url-parse');

var START_URL = "https://www.chevron.com";
var SEARCH_WORD = "IoT";
var MAX_PAGES_TO_FOUND = 10;

var pagesVisited = {};
var numPagesFound = 0;
var pagesToVisit = [];
var list =[];
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;
var filename =0;

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

pagesToVisit.push(START_URL);
crawl();

let handleRequest = (request, response) => {
  response.writeHead(200, {
      'Content-Type': 'text/html'
  });

  fs.readFile('./1.html', null, function (error, data) {          
      if (error) {
          response.writeHead(404);
          respone.write('Whoops! File not found!');
      } else {
        if(data){
          response.write(data);
        }
      }
      response.end();
  });
};
var server=http.createServer(handleRequest);
server.listen(5001);
function crawl() {
  if(numPagesFound >= MAX_PAGES_TO_FOUND) {
    open('http://localhost:5001');
    return;
  }

  var nextPage = pagesToVisit.pop();
  if (nextPage in pagesVisited) {
    // We've already visited this page, so repeat the crawl
    crawl();
  } else {
    // New page we haven't visited
    visitPage(nextPage, crawl);
  }
}

function visitPage(url, callback) {
  if(url !== undefined && (url.indexOf(".pdf") !== -1 || url.indexOf(".zip")!== -1)){
    callback();
    return;
  }
  // Add page to our set
  pagesVisited[url] = true;

  // Make the request
  console.log("Visiting page " + url);
  if(url==undefined){
    callback();
    return;
  }
  request(url, function(error, response, body) {
     // Check status code (200 is HTTP OK)
      if(!response){
        return;
      }
     console.log("Status code: " + response.statusCode);
     if(response.statusCode !== 200) {
       crawl();
       return;
     }
     // Parse the document body
     var $ = cheerio.load(body);
     var isWordFound = searchForWord($, SEARCH_WORD);
     if(isWordFound) {
       numPagesFound++;
       //saving the page
       filename++;
       var htmlmarker = $.html().replaceAll(SEARCH_WORD, "<mark>" + SEARCH_WORD + "</mark>");
       fs.writeFile("./"+filename+".html", htmlmarker, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
      });
       console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
       list.push(url);
       console.log(list);
       callback();
     } else {
       collectInternalLinks($);
       // In this short program, our callback is just calling crawl()
       callback();
     }
  });
}

function searchForWord($, word) {
  var bodyText = $('html > body').text();
  return(bodyText.indexOf(word) !== -1);
}

function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function() {
        pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
}