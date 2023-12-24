import { ProtocolNotSupported } from './exceptions/ProtocolNotSupported.mjs';

const isValidUrl = (url, protocols = ['http:', 'https:', 'ftp:', 'sftp:']) => {
  try {
    const { protocol = '' } = new URL(url);
    if (protocol && !protocols.includes(`${protocol}`)) {
      throw new ProtocolNotSupported(`${protocol} not supported. Supported protocols are ${protocols.join(', ')}`);
    }

    return true;
  } catch (error) {
    console.log('h ', error.name);
    throw error;
  }
};

export { isValidUrl };
