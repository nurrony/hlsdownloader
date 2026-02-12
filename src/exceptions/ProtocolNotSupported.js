/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Exception to throw if HLSDownloader does not support the given URI protocol
 */
class ProtocolNotSupported extends Error {
  /**
   * @param message
   * message message of exception
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
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Exception to throw if HLSDownloader does not support the given URI protocol
 */
export default ProtocolNotSupported;
