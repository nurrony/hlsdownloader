/**
 * @class
 * @classdesc Protocol not supported class
 * @extends Error
 * @author Nur Rony<pro.nmrony@gmail.com>
 */
class ProtocolNotSupported extends Error {
  /**
   * Constructor of ProtocolNotSupported
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
 * @memberof modules:Exceptions
 * @name ProtocolNotSupported
 */
export { ProtocolNotSupported };
