const SHA3 = require('keccakjs')
const secp256k1 = require('secp256k1')
const assert = require('assert')
const rlp = require('rlp')
const BN = require('bn.js')
const crypto = require('crypto')

/**
 * the max integer that this VM can handle (a ```BN```)
 * @var {BN} MAX_INTEGER
 */
exports.MAX_INTEGER = new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16)

/**
 * 2^256 (a ```BN```)
 * @var {BN} TWO_POW256
 */
exports.TWO_POW256 = new BN('10000000000000000000000000000000000000000000000000000000000000000', 16)

/**
 * SHA3-256 hash of null (a ```String```)
 * @var {String} SHA3_NULL_S
 */
exports.SHA3_NULL_S = 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'

/**
 * SHA3-256 hash of null (a ```Buffer```)
 * @var {Buffer} SHA3_NULL
 */
exports.SHA3_NULL = new Buffer(exports.SHA3_NULL_S, 'hex')

/**
 * SHA3-256 of an RLP of an empty array (a ```String```)
 * @var {String} SHA3_RLP_ARRAY_S
 */
exports.SHA3_RLP_ARRAY_S = '1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347'

/**
 * SHA3-256 of an RLP of an empty array (a ```Buffer```)
 * @var {Buffer} SHA3_RLP_ARRAY
 */
exports.SHA3_RLP_ARRAY = new Buffer(exports.SHA3_RLP_ARRAY_S, 'hex')

/**
 * SHA3-256 hash of the RLP of null  (a ```String```)
 * @var {String} SHA3_RLP_S
 */
exports.SHA3_RLP_S = '56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'

/**
 * SHA3-256 hash of the RLP of null (a ```Buffer```)
 * @var {Buffer} SHA3_RLP
 */
exports.SHA3_RLP = new Buffer(exports.SHA3_RLP_S, 'hex')

/**
 * [`BN`](https://github.com/indutny/bn.js)
 * @var {Function}
 */
exports.BN = BN

/**
 * [`rlp`](https://github.com/ethereumjs/rlp)
 * @var {Function}
 */
exports.rlp = rlp

/**
 * [`secp256k1`](https://github.com/cryptocoinjs/secp256k1-node/)
 * @var {Object}
 */
exports.secp256k1 = secp256k1

/**
 * Returns a buffer filled with 0s
 * @method zeros
 * @param {Number} bytes  the number of bytes the buffer should be
 * @return {Buffer}
 */
exports.zeros = function (bytes) {
  var buf = new Buffer(bytes)
  buf.fill(0)
  return buf
}

/**
 * Left Pads an `Array` or `Buffer` with leading zeros till it has `length` bytes.
 * Or it truncates the beginning if it exceeds.
 * @method lsetLength
 * @param {Buffer|Array} msg the value to pad
 * @param {Number} length the number of bytes the output should be
 * @param {Boolean} [right=false] whether to start padding form the left or right
 * @return {Buffer|Array}
 */
exports.setLengthL = exports.setLength = function (msg, length, right) {
  var buf = exports.zeros(length)
  msg = exports.toBuffer(msg)
  if (right) {
    if (msg.length < length) {
      msg.copy(buf)
      return buf
    }
    return msg.slice(0, length)
  } else {
    if (msg.length < length) {
      msg.copy(buf, length - msg.length)
      return buf
    }
    return msg.slice(-length)
  }
}

/**
 * Right Pads an `Array` or `Buffer` with leading zeros till it has `length` bytes.
 * Or it truncates the beginning if it exceeds.
 * @method lsetLength
 * @param {Buffer|Array} msg the value to pad
 * @param {Number} length the number of bytes the output should be
 * @return {Buffer|Array}
 */
exports.setLengthR = function (msg, length) {
  return exports.setLength(msg, length, true)
}

/**
 * Trims leading zeros from a `Buffer` or an `Array`
 * @method unpad
 * @param {Buffer|Array|String} a
 * @return {Buffer|Array|String}
 */
exports.unpad = exports.stripZeros = function (a) {
  a = exports.stripHexPrefix(a)
  var first = a[0]
  while (a.length > 0 && first.toString() === '0') {
    a = a.slice(1)
    first = a[0]
  }
  return a
}
/**
 * Attempts to turn a value into a `Buffer`. As input it supports `Buffer`, `String`, `Number`, null/undefined, `BN` and other objects with a `toArray()` or `toBuffer()` method.
 * @method toBuffer
 * @param {*} v the value
 */
exports.toBuffer = function (v) {
  if (!Buffer.isBuffer(v)) {
    if (Array.isArray(v)) {
      v = new Buffer(v)
    } else if (typeof v === 'string') {
      if (exports.isHexPrefixed(v)) {
        v = new Buffer(exports.padToEven(exports.stripHexPrefix(v)), 'hex')
      } else {
        v = new Buffer(v)
      }
    } else if (typeof v === 'number') {
      v = exports.intToBuffer(v)
    } else if (v === null || v === undefined) {
      v = new Buffer([])
    } else if (v.toBuffer) {
      v = v.toBuffer()
    } else if (v.toArray) {
      v = new Buffer(v.toArray())
    } else {
      throw new Error('invalid type')
    }
  }
  return v
}

/**
 * Converts a `Number` into a hex `String`
 * @method intToHex
 * @param {Number} i
 * @return {String}
 */
exports.intToHex = function (i) {
  assert(i % 1 === 0, 'number is not a integer')
  assert(i >= 0, 'number must be positive')
  var hex = i.toString(16)
  if (hex.length % 2) {
    hex = '0' + hex
  }

  return '0x' + hex
}

/**
 * Converts an `Number` to a `Buffer`
 * @method intToBuffer
 * @param {Number} i
 * @return {Buffer}
 */
exports.intToBuffer = function (i) {
  var hex = exports.intToHex(i)
  return new Buffer(hex.slice(2), 'hex')
}

/**
 * Converts a `Buffer` to a `Number`
 * @method bufferToInt
 * @param {Buffer} buf
 * @return {Number}
 */
exports.bufferToInt = function (buf) {
  buf = exports.toBuffer(buf)
  if (buf.length === 0) {
    return 0
  }

  return parseInt(buf.toString('hex'), 16)
}

/**
 * Interprets a `Buffer` as a signed integer and returns a `BN`. Assumes 256-bit numbers.
 * @method fromSigned
 * @param {Buffer} num
 * @return {BN}
 */
exports.fromSigned = function (num) {
  return new BN(num).fromTwos(256);
}

/**
 * Converts a `BN` to an unsigned integer and returns it as a `Buffer`. Assumes 256-bit numbers.
 * @method toUnsigned
 * @param {BN} num
 * @return {Buffer}
 */
exports.toUnsigned = function (num) {
  return num.toTwos(256).toBuffer()
}

/**
 * Creates SHA-3 hash of the input
 * @method sha3
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Number} [bytes=256] the SHA width
 * @return {Buffer}
 */
exports.sha3 = function (a, bytes) {
  a = exports.toBuffer(a)
  if (!bytes) bytes = 256

  var h = new SHA3(bytes)
  if (a) {
    h.update(a)
  }
  return new Buffer(h.digest('hex'), 'hex')
}

/**
 * Creates SHA256 hash of the input
 * @method sha256
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
exports.sha256 = function (a) {
  a = exports.toBuffer(a)
  return crypto.createHash('SHA256').update(a).digest()
}

/**
 * Creates RIPEMD160 hash of the input
 * @method ripemd160
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Boolean} padded whether it should be padded to 256 bits or not
 * @return {Buffer}
 */
exports.ripemd160 = function (a, padded) {
  a = exports.toBuffer(a)
  var hash = crypto.createHash('rmd160').update(a).digest()
  if (padded === true) {
    return exports.setLength(hash, 32)
  } else {
    return hash
  }
}

/**
 * Creates SHA-3 hash of the RLP encoded version of the input
 * @method rlphash
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
exports.rlphash = function (a) {
  return exports.sha3(rlp.encode(a))
}

/**
 * Returns the ethereum address of a given public key.
 * Accepts "Ethereum public keys" and SEC1 encoded keys.
 * @method publicToAddress
 * @param {Buffer} pubKey The two points of an uncompressed key, unless sanitize is enabled
 * @param {Boolean} sanitize Accept public keys in other formats
 * @return {Buffer}
 */
exports.pubToAddress = exports.publicToAddress = function (pubKey, sanitize) {
  pubKey = exports.toBuffer(pubKey)
  if (sanitize && (pubKey.length !== 64)) {
    pubKey = secp256k1.publicKeyConvert(pubKey, false).slice(1)
  }
  assert(pubKey.length === 64)
  // Only take the lower 160bits of the hash
  return exports.sha3(pubKey).slice(-20)
}

/**
 * Returns the ethereum public key of a given private key
 * @method privateToPublic
 * @param {Buffer} privateKey A private key must be 256 bits wide
 * @return {Buffer}
 */
var privateToPublic = exports.privateToPublic = function (privateKey) {
  privateKey = exports.toBuffer(privateKey)
  // skip the type flag and use the X, Y points
  return secp256k1.publicKeyConvert(secp256k1.publicKeyCreate(privateKey), false).slice(1)
}

/**
 * Returns the ethereum address of a given private key
 * @method privateToAddress
 * @param {Buffer} privateKey A private key must be 256 bits wide
 * @return {Buffer}
 */
exports.privateToAddress = function (privateKey) {
  return exports.publicToAddress(privateToPublic(privateKey))
}

/**
 * Generates an address of a newly created contract
 * @method generateAddress
 * @param {Buffer} from the address which is creating this new address
 * @param {Buffer} nonce the nonce of the from account
 * @return {Buffer}
 */
exports.generateAddress = function (from, nonce) {
  from = exports.toBuffer(from)
  nonce = new BN(nonce)

  if (nonce.isZero()) {
    // in RLP we want to encode null in the case of zero nonce
    // read the RLP documentation for an answer if you dare
    nonce = null
  } else {
    nonce = nonce.toBuffer()
  }

  // Only take the lower 160bits of the hash
  return exports.rlphash([from, nonce]).slice(-20)
}

/**
 * Returns true if the supplied address belongs to a precompiled account
 * @method isPrecompiled
 * @param {Buffer|String} address
 * @return {Boolean}
 */
exports.isPrecompiled = function (address) {
  var a = exports.unpad(address)
  return a.length === 1 && a[0] > 0 && a[0] < 5
}

/**
 * Returns a `Boolean` on whether or not the a `String` starts with "0x"
 * @method isHexPrefixed
 * @param {String} str
 * @return {Boolean}
 */
exports.isHexPrefixed = function (str) {
  return str.slice(0, 2) === '0x'
}

/**
 * Removes "0x" from a given `String`
 * @method stripHexPrefix
 * @param {String} str
 * @return {String}
 */
exports.stripHexPrefix = function (str) {
  if (typeof str !== 'string') {
    return str
  }
  return exports.isHexPrefixed(str) ? str.slice(2) : str
}

/**
 * Adds "0x" to a given `String` if it does not already start with "0x"
 * @method addHexPrefix
 * @param {String} str
 * @return {String}
 */
exports.addHexPrefix = function (str) {
  if (typeof str !== 'string') {
    return str
  }

  return exports.isHexPrefixed(str) ? str : '0x' + str
}

/**
 * Pads a `String` to have an even length
 * @method padToEven
 * @param {String} a
 * @return {String}
 */
exports.padToEven = function (a) {
  if (a.length % 2) a = '0' + a
  return a
}

/**
 * ECDSA sign
 * @method ecsign
 * @param {Buffer} msgHash
 * @param {Buffer} privateKey
 * @return {Object}
 */
exports.ecsign = function (msgHash, privateKey) {
  var sig = secp256k1.sign(msgHash, privateKey)

  var ret = {}
  ret.r = sig.signature.slice(0, 32)
  ret.s = sig.signature.slice(32, 64)
  ret.v = sig.recovery + 27
  return ret
}

/**
 * ECDSA public key recovery from signature
 * @method ecrecover
 * @param {Buffer} msgHash
 * @param {Buffer} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @return {Buffer} publicKey
 */
exports.ecrecover = function (msgHash, v, r, s) {
  var signature = Buffer.concat([exports.setLength(r, 32), exports.setLength(s, 32)], 64)
  var recovery = exports.bufferToInt(v) - 27
  var senderPubKey = secp256k1.recover(msgHash, signature, recovery)
  return secp256k1.publicKeyConvert(senderPubKey, false).slice(1)
}

/**
 * Converts a `Buffer` or `Array` to JSON
 * @method BAToJSON
 * @param {Buffer|Array} ba
 * @return {Array|String|null}
 */
exports.baToJSON = function (ba) {
  if (Buffer.isBuffer(ba)) {
    return '0x' + ba.toString('hex')
  } else if (ba instanceof Array) {
    var array = []
    for (var i = 0; i < ba.length; i++) {
      array.push(exports.baToJSON(ba[i]))
    }
    return array
  }
}

/**
 * Defines properties on a `Object`. It make the assumption that underlying data is binary.
 * @method defineProperties
 * @param {Object} self the `Object` to define properties on
 * @param {Array} fields an array fields to define. Fields can contain:
 * * `name` - the name of the properties
 * * `length` - the number of bytes the field can have
 * * `allowLess` - if the field can be less than the length
 * * `allowEmpty`
 * @param {*} data data to be validated against the definitions
 */
exports.defineProperties = function (self, fields, data) {
  self.raw = []
  self._fields = []

  // attach the `toJSON`
  self.toJSON = function (label) {
    if (label) {
      var obj = {}
      self._fields.forEach(function (field) {
        obj[field] = '0x' + self[field].toString('hex')
      })
      return obj
    }
    return exports.baToJSON(this.raw)
  }

  self.serialize = function serialize () {
    return rlp.encode(self.raw)
  }

  fields.forEach(function (field, i) {
    self._fields.push(field.name)
    function getter () {
      return self.raw[i]
    }
    function setter (v) {
      v = exports.toBuffer(v)

      if (v.toString('hex') === '00' && !field.allowZero) {
        v = new Buffer([])
      }

      if (field.allowLess && field.length) {
        v = exports.stripZeros(v)
        assert(field.length >= v.length, 'The field ' + field.name + ' must not have more ' + field.length + ' bytes')
      } else if (!(field.allowZero && v.length === 0) && field.length) {
        assert(field.length === v.length, 'The field ' + field.name + ' must have byte length of ' + field.length)
      }

      self.raw[i] = v
    }

    Object.defineProperty(self, field.name, {
      enumerable: true,
      configurable: true,
      get: getter,
      set: setter
    })

    if (field.default) {
      self[field.name] = field.default
    }

    // attach alias
    if (field.alias) {
      Object.defineProperty(self, field.alais, {
        enumerable: false,
        configurable: true,
        set: setter,
        get: getter
      })
    }
  })

  // if the constuctor is passed data
  if (data) {
    if (typeof data === 'string') {
      data = new Buffer(exports.stripHexPrefix(data), 'hex')
    }

    if (Buffer.isBuffer(data)) {
      data = rlp.decode(data)
    }

    if (Array.isArray(data)) {
      if (data.length > self._fields.length) {
        throw (new Error('wrong number of fields in data'))
      }

      // make sure all the items are buffers
      data.forEach(function (d, i) {
        self[self._fields[i]] = exports.toBuffer(d)
      })
    } else if (typeof data === 'object') {
      for (var prop in data) {
        if (self._fields.indexOf(prop) !== -1) {
          self[prop] = data[prop]
        }
      }
    } else {
      throw new Error('invalid data')
    }
  }
}
