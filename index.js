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

/**
 * @constructor {Function} HLSParser
 */
function HLSParser(playListInfo) {
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
  }).catch(function(error) {
    return callback(error);
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
          return callback(err);
        }
        self.downloadItems(callback);
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
      return downloadedItem = null;
    }).catch(cb);

  }, function(err) {
    return callback(err, 'Download Done for' + self.playlistURL);
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
