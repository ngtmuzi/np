/**
 * Created by ngtmuzi on 2017/1/16.
 */
'use strict';
//0,1,2 : pending, fulfilled,rejected

class Np {

  constructor(fn) {
    this.state     = 0;
    this.callbacks = [];

    if (fn) {
      try {
        fn(this.resolve.bind(this), this.reject.bind(this));
      } catch (err) {
        this.state  = 2;
        this.reason = err;
      }
    }
  }

  //实现2.3 The Promise Resolution Procedure部分
  resolve(value) {
    if (this.state) return;
    if (value === this) this.reject(new TypeError('same object'));

    process.nextTick(() => {
      if (value && (typeof value === 'object' || typeof value === 'function')) {
        let isCalled = 0;
        try {
          let then = value.then;
          if (typeof then === 'function')
            return then.bind(value)(
              value => !isCalled++ ? this.resolve(value) : 0,
              reason => !isCalled++ ? this.reject(reason) : 0
            );
        } catch (err) {
          if (!isCalled++) this.reject(err);
          return;
        }
      }

      this.state = 1;
      this.value = value;
      this.callbacks.forEach(fn => fn(this));
    });
  }

  reject(reason) {
    if (this.state) return;
    if (reason === this) this.reject(new TypeError('same object'));
    process.nextTick(() => {
      this.state  = 2;
      this.reason = reason;
      this.callbacks.forEach(fn => fn(this));
    });
  }


  then(onFulfilled, onRejected) {

    if (this.state === 1) {
      return (typeof onFulfilled === 'function') ?
        Np.resolve({then: () => onFulfilled(this.value)}) :
        this;
    }
    if (this.state === 2) {
      return (typeof onRejected === 'function') ?
        Np.resolve({then: () => onRejected(this.reason)}) :
        this;
    }

    return new Np((resolve, reject) => {
      this.callbacks.push((promise) => {
        try {
          if (this.state === 1) {
            resolve(typeof onFulfilled === 'function' ?
              onFulfilled(this.value) :
              this.value);
          } else {
            if (typeof onRejected === 'function')
              resolve(onRejected(this.reason));
            else
              reject(this.reason);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}


Np.resolve = value => {
  const p = new Np();
  p.resolve(value);
  return p;
};

Np.reject = reason => {
  const p = new Np();
  p.reject(reason);
  return p;
};

module.exports = Np;