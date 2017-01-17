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
    fn(this.resolve.bind(this), this.reject.bind(this));
  }
}

Np.prototype.resolve = function (value) {
  setImmediate(() => {
    if (this.state) return;
    if (value && typeof value.then === 'function') {
      value.then(value => this.resolve(value), reason => this.reject(reason));
    } else {
      this.state = 1;
      this.value = value;
      this.onFulfilledFns.forEach(fn => fn(value));
    }
  });
};

Np.prototype.reject = function (reason) {
  setImmediate(() => {
    if (this.state) return;
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
//  console.log(this.state,this.value,this.reason,onFulfilled,onRejected);
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
      }catch (err){
        reject(err);
      }
    })
  });
};

//Np.prototype.catch = function (onRejected) {
//  const self = this;
//  return new Np(function (resolve, reject) {
//    self.onRejectedFns.push(function (reason) {
//      resolve(onRejected(reason));
//    })
//  });
//};

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

//new Np(function (resolve, reject) {
//  setTimeout(function () {
//    resolve(123);
//  }, 500);
//}).then(1,2).then(console.log, console.error);

//Np.reject(1222).then(() => {}, undefined).then(undefined, console.error);