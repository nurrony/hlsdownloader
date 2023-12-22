import validUrl from 'valid-url';

function isValidUrl(uri) {
  return !!validUrl.isUri(uri) && !!validUrl.isWebUri(uri);
}

export { isValidUrl };
