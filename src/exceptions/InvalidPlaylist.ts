/**
 * @author Nur Rony<pro.nmrony@gmail.com>
 * @classdesc Exception to throw if HLS playlist is invalid
 */
class InvalidPlaylist extends Error {
  /**
   * Constructor of InvalidPlayList
   * @param message
   * message - Optional error message
   */
  constructor(message?: string) {
    super(message);

    this.name = this.constructor.name;

    Object.setPrototypeOf(this, InvalidPlaylist.prototype);

    // Capturing the stack trace (standard in V8/Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default InvalidPlaylist;
