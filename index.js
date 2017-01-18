/**
 * Created by ngtmuzi on 2017/1/16.
 */
'use strict';
//0,1,2 : pending, fulfilled,rejected

function Np(fn) {
  this.state          = 0;
  this.onFulfilledFns = [];
  this.onRejectedFns  = [];
  if (fn) {
    try {
      fn(this.resolve.bind(this), this.reject.bind(this));
    } catch (err) {
      this.state  = 2;
      this.reason = err;
    }
  }
}

Np.prototype.resolve = function (value) {

  setImmediate(() => {

    if (this.state) return;
    if (value === this) this.reject(new TypeError('same object'));

    let hasBeenCalled = false;
    if (value && (typeof value === 'object' || typeof value === 'function')) {
      try {

        let then = value.then;
        if (typeof then === 'function')
          return then.bind(value)(value => {
            if (hasBeenCalled) return;
            hasBeenCalled = true;
            this.resolve(value);
          }, reason => {
            if (hasBeenCalled) return;
            hasBeenCalled = true;
            this.reject(reason);
          });
      } catch (err) {
        if (hasBeenCalled) return;
        hasBeenCalled = true;
        return this.reject(err);
      }
    }

    this.state = 1;
    this.value = value;
    this.onFulfilledFns.forEach(fn => fn(value));
  });
};

Np.prototype.reject = function (reason) {
  setImmediate(() => {
    if (this.state) return;
    if (reason === this) this.reject(new TypeError('same object'));
//    if (reason && typeof reason.then === 'function') {
//      reason.then(value => this.reject(value), reason => this.reject(reason));
//    } else {
    this.state  = 2;
    this.reason = reason;
    this.onRejectedFns.forEach(fn => fn(reason));
//    }
  });
};

Np.prototype.then = function (onFulfilled, onRejected) {


//  if (typeof onFulfilled !=='function') throw new Error('axxx');
//  if (arguments.length>1 && typeof onRejected!=='function') throw new Error('ssss');

  const self = this;
  if (this.state === 1) {
    if (typeof onFulfilled === 'function')
      return new Np((resolve, reject) => {
        setImmediate(() => {
          try {
            resolve(onFulfilled(this.value))
          } catch (err) {
            reject(err);
          }
        });
      });
    else
      return Np.resolve(this.value);
  }
  if (this.state === 2) {
    if (typeof onRejected === 'function')
      return new Np((resolve, reject) => {
        setImmediate(() => {
          try {
            resolve(onRejected(this.reason))
          } catch (err) {
            reject(err);
          }
        });
      });
    else
      return Np.reject(this.reason);
  }

  return new Np(function (resolve, reject) {
    self.onFulfilledFns.push(function (value) {
      try {

        typeof onFulfilled === 'function' ?
          resolve(onFulfilled(value)) :
          resolve(value);
      } catch (err) {
        reject(err);
      }
    });
    self.onRejectedFns.push(function (reason) {
      try {
        typeof onRejected === 'function' ?
          resolve(onRejected(reason)) :
          reject(reason);
      } catch (err) {
        reject(err);
      }
    });
  });
};

Np.resolve = function (value) {
  if (value && typeof value.then === 'function') {
    return new Np(function (resolve, reject) {
      value.then(resolve, reject);
    });
  }

  const p = new Np();
  p.resolve(value);
  return p;
};

Np.reject = function (reason) {
  if (reason && typeof reason.then === 'function') {
    return new Np(function (resolve, reject) {
      reason.then(reject, reject);
    });
  }

  const p = new Np();
  p.reject(reason);
  return p;
};

module.exports = Np;