/**
 * Exception to throw if Protocol is not supported
 * @author Nur Rony <pro.nmrony@gmail.com>
 */
export default class UnsupportedProtocol extends Error {
  /**
   * @param message - Optional error message
   */
  constructor(message?: string) {
    super(message);

    // Set the error name to the class name
    this.name = this.constructor.name;

    // Restore prototype chain for built-in classes in TS/ES5+
    Object.setPrototypeOf(this, UnsupportedProtocol.prototype);

    // Capturing the stack trace (standard in V8/Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
