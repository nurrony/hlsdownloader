'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.downloader = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @description Validate a Playlist
 * @param {string} playlistContent
 * @returns {boolean}
 */
function isValidPlaylist(playlistContent) {
  return playlistContent.match(/^#EXTM3U/im) !== null;
}

/**
 * @description Validate a URL
 * @param {string} url URL to validate
 * @returns {boolean}
 */
function validateURL(url) {

  var re_weburl = new RegExp('^' +
  // protocol identifier
  '(?:(?:https?)://)' +
  // user:pass authentication
  '(?:\\S+(?::\\S*)?@)?' + '(?:' +
  // IP address exclusion
  // private & local networks
  '(?!(?:10|127)(?:\\.\\d{1,3}){3})' + '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' + '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
  // IP address dotted notation octets
  // excludes loopback network 0.0.0.0
  // excludes reserved space >= 224.0.0.0
  // excludes network & broacast addresses
  // (first & last IP address of each class)
  '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' + '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' + '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' + '|' +
  // host name
  '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
  // domain name
  '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
  // TLD identifier
  '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' + ')' +
  // port number
  '(?::\\d{2,5})?' +
  // resource path
  '(?:/\\S*)?' + '$', 'i');

  return re_weburl.test(url);
}

/**
 * Strip first slash from a url
 * @param  {String} url URL to strip the slash
 * @return {String} Stripped url
 */
function stripFirstSlash(url) {
  return url.substr(0, 1).replace('/', '') + url.substring(1);
}

/**
 * Strip last slash from a url
 * @param  {String} url URL to strip the slash
 * @return {String} Stripped url
 */
function stripLastSlash(url) {
  return url.substr(-1) + url.substr(0, -1).replace('/', '');
}

var HLSDownloader = function () {
  /**
   * @constructor HLSParser
   * @param  {Object} playlistInfo playlist information to download
   * @return {Object} Error object if any required piece is missing
   */

  function HLSDownloader(playlistInfo) {
    _classCallCheck(this, HLSDownloader);

    if ((typeof playlistInfo === 'undefined' ? 'undefined' : _typeof(playlistInfo)) === 'object' && (playlistInfo.playlistURL === null || playlistInfo.playlistURL === 'undefined' || playlistInfo.playlistURL === '' || !validateURL(playlistInfo.playlistURL))) {
      conosle.log('ERR_VALIDATION: playListURL is required ' + 'or check if your URL is valid or not!!');
    }

    this.playlistURL = playlistInfo.playlistURL;
    this.destination = playlistInfo.destination || null;
    var urls = _url2.default.parse(this.playlistURL, true, true);
    this.hostName = urls.protocol + '//' + urls.hostname + (urls.port ? ':' + urls.port : '');
    this.items = [];
    this.errors = [];
  }

  /**
   * @description initiate download
   * @method {function} startDownload
   * @param {function} callback
   */


  _createClass(HLSDownloader, [{
    key: 'startDownload',
    value: function startDownload(callback) {
      return this.getPlaylist(callback);
    }

    /**
     * @description Download master playlist
     * @method getPlaylist
     * @param {function} callback
     */

  }, {
    key: 'getPlaylist',
    value: function getPlaylist(callback) {

      var self = this;

      _requestPromise2.default.get(self.playlistURL).then(function (body) {

        if (!isValidPlaylist(body)) {
          return callback(new Error('This playlist isn\'t a m3u8 playlist'));
        }

        self.items.push(self.playlistURL.replace(self.hostName + '/', ''));
        self.parseMasterPlaylist(body, callback);
      }).catch(function (err) {
        if (err) {
          var error = new Error('VariantDownloadError');
          error.statusCode = err.statusCode;
          error.uri = err.options.uri;
          return callback(error);
        }
      });
    }

    /**
     * @description Parse master playlist content
     * @method parseMasterPlaylist
     * @param {string} playlistContent
     * @param {function} callback
     */

  }, {
    key: 'parseMasterPlaylist',
    value: function parseMasterPlaylist(playlistContent, callback) {

      var self = this;

      if (playlistContent.match(/^#EXT-X-TARGETDURATION:\d+/im)) {
        this.parseVariantPlaylist(playlistContent);
        this.downloadItems(callback);
      } else {
        try {
          (function () {
            var replacedPlaylistContent = playlistContent.replace(/^#[\s\S].*/igm, '');
            var variants = replacedPlaylistContent.split('\n').filter(function (item) {
              return item !== '';
            });

            var errorCounter = 0;
            var variantCount = variants.length;

            _async2.default.each(variants, function (item, cb) {

              var variantPathObj = _path2.default.dirname(item);
              var variantPath = variantPathObj.substr(0, 1).replace('/', '') + variantPathObj.substring(1);
              var variantUrl = self.hostName + '/' + variantPath + '/' + _path2.default.basename(item);

              _requestPromise2.default.get(variantUrl).then(function (body) {

                if (isValidPlaylist(body)) {
                  self.items.push(variantPath + '/' + _path2.default.basename(item));
                  self.parseVariantPlaylist(variantPath, body);
                  return cb();
                }
              }).catch(function (err) {
                self.errors.push(err.options.uri);

                //check if all variants has error
                if (err && ++errorCounter === variantCount) {
                  return cb(true);
                }

                return cb(null);
              });
            }, function (err) {
              return err ? callback({
                playlistURL: self.playlistURL,
                message: 'No valid Downloadable ' + 'variant exists in master playlist'
              }) : self.downloadItems(callback);
            });
          })();
        } catch (exception) {
          //Catch any syntax error
          return callback(exception);
        }
      }
    }

    /**
     * @description Parse variant playlist content and index the TS chunk to download.
     * @method parseVariantPlaylist
     * @param {string} variantPath
     * @param {string} playlistContent
     */

  }, {
    key: 'parseVariantPlaylist',
    value: function parseVariantPlaylist(variantPath, playlistContent) {
      var replacedPlaylistContent = playlistContent.replace(/^#[\s\S].*/igm, '');
      var items = replacedPlaylistContent.split('\n').filter(function (item) {
        return item !== '';
      }).map(function (item) {
        return variantPath + '/' + _path2.default.basename(item);
      });

      this.items = this.items.concat(items);
    }

    /**
     * @description Download indexed chunks and playlist.
     * @method downloadItems
     * @param {function} callback
     */

  }, {
    key: 'downloadItems',
    value: function downloadItems(callback) {

      var self = this;

      _async2.default.each(this.items, function (item, cb) {

        var variantUrl = self.hostName + '/' + item;

        _requestPromise2.default.get(variantUrl).then(function (downloadedItem) {
          if (self.destination !== null && self.destination !== '' && self.destination !== 'undefined') {
            return self.createItems(variantUrl, downloadedItem, cb);
          }

          downloadedItem = null;
          return cb();
        }).catch(function (err) {
          self.errors.push(err.options.uri);
          return cb(null);
        });
      }, function (err) {
        if (err) {
          return callback({
            playlistURL: self.playlistURL,
            message: 'Internal Server Error from remote'
          });
        }

        if (self.errors.length > 0) {
          return callback(null, {
            message: 'Download done with some errors',
            playlistURL: self.playlistURL,
            errors: self.errors
          });
        }

        return callback(null, {
          message: 'Downloaded successfully',
          playlistURL: self.playlistURL
        });
      });
    }

    /**
     * @description Download indexed chunks and playlist.
     * @method downloadItems
     * @param {function} callback
     */

  }, {
    key: 'createItems',
    value: function createItems(variantURL, content, cb) {

      var self = this;
      var itemPath = variantURL.replace(this.hostName, '');
      var destDirectory = self.destination + _path2.default.dirname(itemPath);
      var filePath = self.destination + '/' + itemPath;
      (0, _mkdirp2.default)(destDirectory, function (err) {
        return err ? cb(err) : _fs2.default.writeFile(filePath, content, cb);
      });
    }
  }]);

  return HLSDownloader;
}();

var downloader = exports.downloader = HLSDownloader;
exports.default = HLSDownloader;
