const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false });

const get = (key) => cache.get(key);
const set = (key, value, ttl = 600) => cache.set(key, value, ttl);
const del = (key) => cache.del(key);
const flush = () => cache.flushAll();

module.exports = { get, set, del, flush, cache };
