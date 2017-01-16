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
  if (this.state) return;
  if (value && typeof value.then === 'function') {
    value.then(value => this.resolve(value),reason=>this.reject(reason));
  } else {
    this.state = 1;
    this.value = value;
    this.onFulfilledFns.forEach(fn => fn(value));
  }
};

Np.prototype.reject = function (reason) {
  if (this.state) return;
  if (reason && typeof reason.then === 'function') {
    reason.then(value => this.reject(value), reason => this.reject(reason));
  } else {
    this.state  = 2;
    this.reason = reason;
    this.onRejectedFns.forEach(fn => fn(reason));
  }
};

Np.prototype.then = function (onFulfilled, onRejected) {
  console.log(this.state,this.value,this.reason,onFulfilled,onRejected);
  const self = this;
  if (this.state === 1 && typeof onFulfilled === 'function') return Np.resolve(onFulfilled(this.value));
  if (this.state === 2 && typeof onRejected === 'function') return Np.resolve(onRejected(this.reason));

  return new Np(function (resolve, reject) {
    self.onFulfilledFns.push(function (value) {
      typeof onFulfilled === 'function' ?
        resolve(onFulfilled(value)) :
        resolve(value);
    });
    self.onRejectedFns.push(function (reason) {
      typeof onRejected === 'function' ?
        resolve(onRejected(reason)) :
        reject(reason);
    })
  });
};

Np.prototype.catch = function (onRejected) {
  const self = this;
  return new Np(function (resolve, reject) {
    self.onRejectedFns.push(function (reason) {
      resolve(onRejected(reason));
    })
  });
};

Np.resolve = function (value) {
  if (value && typeof value.then === 'function') {
    return new Np(function (resolve, reject) {
      value.then(resolve, reject);
    });
  }
  if (value && typeof value.catch === 'function') {
    return new Np(function (resolve, reject) {
      value.catch(reject);
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
  if (reason && typeof reason.catch === 'function') {
    return new Np(function (resolve, reject) {
      reason.catch(reject);
    });
  }

  const p = new Np();
  p.reject(reason);
  return p;
};

module.exports = Np;

//new Np(function (resolve, reject) {
//  setTimeout(function () {
//    reject(123);
//  }, 500);
//}).then(i => i + 1, i => Np.reject(2333)).then(console.log, console.error);