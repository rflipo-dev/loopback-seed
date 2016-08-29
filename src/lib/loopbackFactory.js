export default class LoopbackFactory {
  constructor(name, options) {
    this.name = name;
    this.options = options;
  }

  toJSON() {
    return {
      name: this.name,
      options: this.options
    }
  };
}