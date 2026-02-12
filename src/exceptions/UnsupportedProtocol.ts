/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Exception to throw if Protocol is not supported
 */
class UnsupportedProtocol extends Error {
  /**
   * Constructor of UnsupportedProtocol
   * @param message
   * message - Optional error message
   */
  constructor(message?: string) {
    super(message);

    this.name = this.constructor.name;

    Object.setPrototypeOf(this, UnsupportedProtocol.prototype);

    // Capturing the stack trace (standard in V8/Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default UnsupportedProtocol;
