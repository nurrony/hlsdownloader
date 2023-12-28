/**
 * @class
 * @extends Error
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Exception to throw if HLSDownloader does not support the given URI protocol
 */
class ProtocolNotSupported extends Error {
  /**
   * @constructor
   * @property {String} message message of exception
   */
  constructor(message) {
    super(message);

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * @memberof modules:HLSDownloaderException
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Exception to throw if HLSDownloader does not support the given URI protocol
 */
export default ProtocolNotSupported;
