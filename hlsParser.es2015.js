import fs from 'fs';
import url from 'url';
import path from 'path';
import debugMod from 'debug';
import async from 'async';
import mkdirp from 'mkdirp';
import request from 'request-promise';

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

 class HLSDownloader {
  /**
   * @constructor HLSParser
   * @param  {Object} playlistInfo playlist information to download
   * @return {Object} Error object if any required piece is missing
   */
  constructor(playlistInfo) {
    if (typeof playlistInfo === 'object' &&
        (playlistInfo.playlistURL === null ||
          playlistInfo.playlistURL === 'undefined' ||
          playlistInfo.playlistURL === '' ||
          !validateURL(playlistInfo.playlistURL))) {
      conosle.log('ERR_VALIDATION: playListURL is required ' +
        'or check if your URL is valid or not!!');
    }

    this.playlistURL = playlistInfo.playlistURL;
    this.destination = playlistInfo.destination || null;
    const urls = url.parse(this.playlistURL, true, true);
    this.hostName = urls.protocol + '//' + urls.hostname + (urls.port ? ':' + urls.port : '');
    this.items = [];
    this.errors = [];
  }

  /**
   * @description initiate download
   * @method {function} startDownload
   * @param {function} callback
   */
  startDownload(callback) {
    return this.getPlaylist(callback);
  }

  /**
   * @description Download master playlist
   * @method getPlaylist
   * @param {function} callback
   */
  getPlaylist(callback) {

    const self = this;

    request.get(self.playlistURL).then((body) => {

      if (!isValidPlaylist(body)) {
        return callback(new Error('This playlist isn\'t a m3u8 playlist'));
      }

      self.items.push(self.playlistURL.replace(self.hostName + '/', ''));
      self.parseMasterPlaylist(body, callback);
    }).catch((err) => {
      if (err) {
        const error = new Error('VariantDownloadError');
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
  parseMasterPlaylist(playlistContent, callback) {

    const self = this;

    if (playlistContent.match(/^#EXT-X-TARGETDURATION:\d+/im)) {
      this.parseVariantPlaylist(playlistContent);
      this.downloadItems(callback);
    } else {
      try {
        const replacedPlaylistContent = playlistContent.replace(/^#[\s\S].*/igm, '');
        const variants = replacedPlaylistContent.split('\n').filter(item => item !== '');

        let errorCounter = 0;
        const variantCount = variants.length;

        async.each(variants, (item, cb) => {

          const variantPathObj = path.dirname(item);
          const variantPath = variantPathObj.substr(0, 1).replace('/', '') + variantPathObj.substring(1);
          const variantUrl = self.hostName + '/' + variantPath + '/' + path.basename(item);

          request.get(variantUrl).then(body => {

            if (isValidPlaylist(body)) {
              self.items.push(variantPath + '/' + path.basename(item));
              self.parseVariantPlaylist(variantPath, body);
              return cb();
            }
          }).catch(err => {
            self.errors.push(err.options.uri);

            //check if all variants has error
            if (err && ++errorCounter === variantCount) {
              return cb(true);
            }

            return cb(null);
          });
        }, err => (err) ? callback({
            playlistURL: self.playlistURL,
            message: 'No valid Downloadable ' +
              'variant exists in master playlist'
          }) : self.downloadItems(callback));
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
  parseVariantPlaylist(variantPath, playlistContent) {
    const replacedPlaylistContent = playlistContent.replace(/^#[\s\S].*/igm, '');
    let items = replacedPlaylistContent
      .split('\n')
      .filter((item) => item !== '')
      .map((item) => variantPath + '/' + path.basename(item));

    this.items = this.items.concat(items);
  }

  /**
   * @description Download indexed chunks and playlist.
   * @method downloadItems
   * @param {function} callback
   */
  downloadItems(callback) {

    const self = this;

    async.each(this.items, (item, cb) => {

      const variantUrl = self.hostName + '/' + item;

      request.get(variantUrl).then(downloadedItem => {
        if (self.destination !== null &&
          self.destination !== '' &&
          self.destination !== 'undefined') {
          return self.createItems(variantUrl, downloadedItem, cb);
        }

        downloadedItem = null;
        return cb();
      }).catch(err => {
        self.errors.push(err.options.uri);
        return cb(null);
      });
    }, err => {
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
        })
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
  createItems(variantURL, content, cb) {

    const self = this;
    const itemPath = variantURL.replace(this.hostName, '');
    const destDirectory = self.destination + path.dirname(itemPath);
    const filePath = self.destination + '/' + itemPath;
    mkdirp(destDirectory, err => (err) ? cb(err) : fs.writeFile(filePath, content, cb));
  }
}

export const downloader = HLSDownloader;
export default HLSDownloader;
