// const proxyUrl = 'https://cors-anywhere.herokuapp.com';
const proxyUrl = 'https://private-cors-server.herokuapp.com';

const comicReaderUtils = {
  proxiedRequest: (url, options = {}) => {
    return fetch(`${proxyUrl}/${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'X-Requested-With': 'wololo',
      },
    })
    .then(resp => resp.json())
    .then(res => res)
    .catch(error => error)
  },
  isEmpty: (value) => {
    if (typeof value === "object" && value.constructor === Object) {
      for (let i in value) { // 2x as fast as Object.keys(value).length
        return false;
      }
      return true;
    }
  }
};

export default comicReaderUtils;