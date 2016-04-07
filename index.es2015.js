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
function stripFirstSlash(url){
  return url.substr(0, 1).replace('/','') + url.substring(1);
}

/**
 * Strip last slash from a url
 * @param  {String} url URL to strip the slash
 * @return {String} Stripped url
 */
function stripLastSlash(url){
  return url.substr(-1) + url.substr(0, -1).replace('/','');
}

class HLSParser {
    constructor() {

    }
}