import LoopbackSeed from './lib/loopbackSeed';

module.exports = function(app, options) {
  let seeder = new LoopbackSeed();
  app.seeder = seeder;
};
