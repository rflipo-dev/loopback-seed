import LoopbackFactory from './loopbackFactory';

class LoopbackSeed {
  constructor() {
    this.factory = [];
  }

  createFactory(name, options) {
    this.factory.push(new LoopbackFactory(name, options).toJSON());
  }
}