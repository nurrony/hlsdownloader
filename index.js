'use strict';

var debug = require('debug')('hls');
var request = require('request-promise');
var fs = require('fs');
var mkdirp = require('mkdirp');
var url = require('url');
var path = require('path');
var async = require('async');

/**
 * @description Validate a Playlist
 */
function isValidPlaylist(playlistContent) {
  return playlistContent.match(/^#EXTM3U/im) !== null;
}

function validateURL(url) {

  //https://gist.github.com/dperini/729294
  //ignoring FTP protocol
  var re_weburl = new RegExp(
      '^' +
      // protocol identifier
      '(?:(?:https?)://)' +
      // user:pass authentication
      '(?:\\S+(?::\\S*)?@)?' +
      '(?:' +
      // IP address exclusion
      // private & local networks
      '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
      '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
      '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
      // IP address dotted notation octets
      // excludes loopback network 0.0.0.0
      // excludes reserved space >= 224.0.0.0
      // excludes network & broacast addresses
      // (first & last IP address of each class)
      '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
      '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
      '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
      '|' +
      // host name
      '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
      // domain name
      '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
      // TLD identifier
      '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' +
      ')' +
      // port number
      '(?::\\d{2,5})?' +
      // resource path
      '(?:/\\S*)?' +
      '$', 'i'
  );

  return re_weburl.test(url);
}

/**
 * @constructor {Function} HLSParser
 */
function HLSParser(playListInfo) {

  if (playListInfo.playlistURL === null ||
      playListInfo.playlistURL === 'undefined' ||
      playListInfo.playlistURL === '' || !validateURL(playListInfo.playlistURL)) {

    var error = new Error('VALIDATION');
    error.message = 'playListURL is required or check if your URL is valid or not!!';
    throw error;
  }

  this.playlistURL = playListInfo.playlistURL;
  this.destination = playListInfo.destination || null;
  var urls = url.parse(this.playlistURL, true, true);
  this.hostName = urls.protocol + '//' +
  urls.hostname + (urls.port ?  ':' + urls.port : '');
  this.items = [];
  debug('Configurations: \n', JSON.stringify(this));
}

HLSParser.prototype.startDownload = function(callback) {
  return this.getPlaylist(callback);
};
HLSParser.prototype.getPlaylist = function(callback) {

  var self = this;

  request.get(self.playlistURL).then(function(body) {
    if (!isValidPlaylist(body)) {
      return callback(new Error('This playlist isn\'t a m3u8 playlist'));
    }

    self.items.push(self.playlistURL.replace(self.hostName, ''));
    self.parseMasterPlaylist(body, callback);
  }).catch(function(err) {
    if (err) {
      var error = new Error('VariantDownloadError');
      error.statusCode = err.statusCode;
      error.uri = err.options.uri;
      return callback(error);
    }
  });
};


HLSParser.prototype.parseMasterPlaylist = function(playlistContent, callback) {

  var self = this;

  if (playlistContent.match(/^#EXT-X-TARGETDURATION:\d+/im)) {
    this.parseVariantPlaylist(playlistContent);
    this.downloadItems(callback);
  } else {
    try {
      var replacedPlaylistContent = playlistContent.replace(/^#[\s\S].*/igm, '');
      var variants = replacedPlaylistContent.split('\n').filter(function(item) {
        return item !== '';
      });

      async.each(variants, function(item, cb) {
        var vaiantPath = path.dirname(item);
        var variantUrl = self.hostName + '/' + path.dirname(item) + '/' + path.basename(item);
        self.items.push(item);
        request.get(variantUrl).then(function(body) {
          self.parseVariantPlaylist(vaiantPath,body);
          return cb();
        }).catch(cb);
      }, function(err) {
        if (err) {
          var error = new Error('VariantDownloadError');
          error.statusCode = err.statusCode;
          error.uri = err.options.uri;
          return callback(error);
        }
        return self.downloadItems(callback);
      });
    } catch (exception) {
      return callback(exception);
    }
  }

};

HLSParser.prototype.parseVariantPlaylist = function(variantPath, playlistContent) {

  var replacedPlaylistContent = playlistContent.replace(/^#[\s\S].*/igm, '');
  var items = replacedPlaylistContent.split('\n').filter(function(item) {
    return item !== '';
  }).map(function(item) {
    return variantPath + '/' + item.replace(variantPath + '/', '');
  });

  this.items = this.items.concat(items);
};

HLSParser.prototype.downloadItems = function(callback) {

  var self = this;

  async.each(this.items, function(item, cb) {
    var variantUrl = self.hostName + item;

    debug('In downloadItem', variantUrl);

    request.get(variantUrl).then(function(downloadedItem) {
      if (self.destination !== null) {
        return self.createItems(variantUrl, downloadedItem, cb);
      }
      downloadedItem = null;
      return cb();
    }).catch(cb);

  }, function(err) {
    if (err) {
      var error = new Error('ItemDownloadError');
      error.statusCode = err.statusCode;
      error.uri = err.options.uri;
      return callback(error);
    }
    return callback(null, 'Download Done for ' + self.playlistURL);
  });
};

HLSParser.prototype.createItems = function(variantURL, content, cb) {

  var self = this;
  var itemPath = variantURL.replace(this.hostName,'');
  mkdirp(self.destination + path.dirname(itemPath), function(err) {
    if (err) {
      return cb(err);
    }
    return fs.writeFile(self.destination + '/' + itemPath, content, cb);
  });

};

module.exports = HLSParser;
