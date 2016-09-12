import LoopbackFactory from './loopbackFactory';
import faker from 'faker';
import fs from 'fs';
import path from 'path';

export default class LoopbackSeed {
  constructor(app, options) {
    this.factory = [];
    this.app = app;
    if (options.fakerLocale) {
      faker.locale = options.fakerLocale;
    }
    this.datasource = options.datasource || 'db';
    if (!this.app.dataSources[this.datasource]) {
      throw new Error('You must have a valid datasource set for loopback seeder');
    }

    let root = app.root || process.cwd();
    let seedsDir = options.seedDir; // not currently working
    if (!seedsDir) {
      seedsDir = path.join(root, '/database');
    }
    if (!fs.existsSync(seedsDir)) {
      throw new Error('Can not find seeds path');
    }
    this.seedsDir = seedsDir;
  }

  createFactory(name, options) {
    this.factory.push(new LoopbackFactory(name, options).toJSON());
  }

  getFactory(name) {
    let factory = this.factory.find((key) => key.name == name);
    let factoryInstance = new LoopbackFactory(factory.name, factory.options);
    return factoryInstance;
  }

  migrateAll(overrideEnv = null) {
    let env = overrideEnv || process.env.NODE_ENV || 'default';
    require(this.seedsDir + '/factories');
    switch (env) {
      case 'default':
        require(this.seedsDir + '/seed.default');
        break;
      default:
        require(this.seedsDir + '/seed.' + env);
    }
  }

  migrate(factoryName, size = 1, options = {}, callback = () => {}) {
    let factory = this.getFactory(factoryName);
    let promises = [];
    for (var i = 0; i < size; i++) {
      let newModel = {};
      for (let property in factory.options) {
        if (factory.options[property] == null || (typeof factory.options[property] == 'string' && factory.options[property].startsWith('{{'))) {
          try {
            newModel[property] = faker.fake(factory.options[property]);
          } catch (err) {
            throw err;
          }
        } else {
          newModel[property] = factory.options[property];
        }
        if (options[property] !== undefined) {
          newModel[property] = options[property];
        }
      }
      callback(newModel);
      promises.push(this.createModel(factoryName, newModel));
    }
    return Promise.all(promises);
  }

  createModel(name, model) {
    return new Promise((resolve, reject) => {
      this.app.models[name].create(model, (err, instance) => {
        if (err) reject(err);
        console.log(instance);
        resolve(instance);
      });
    });
  }

  reset(dsName, exit = false) {
    let ds = this.app.dataSources[dsName];
    let tables = [];
    this.app.models().forEach((model) => {
      let modelName = model.modelName;
      if (ds.name === model.dataSource.name) {
        tables.push(modelName);
      }
    });
    let query = " DROP SCHEMA public CASCADE; \
              CREATE SCHEMA public; \
              GRANT ALL ON SCHEMA public TO postgres; \
              GRANT ALL ON SCHEMA public TO public; \
              COMMENT ON SCHEMA public IS 'standard public schema';";

    return new Promise((resolve, reject) => {
      ds.connector.execute(query, [], function(err, result) {
        ds.automigrate(tables, function(err) {
          if (err) reject(err);
          console.log('Loopback tables [' + tables + '] created in ', ds.adapter.name);
          if (exit) {
            ds.disconnect();
          }
          resolve();
        });
      });
    });
  }

  end(dsName) {
    let ds = this.app.dataSources[dsName];
    ds.disconnect();
  }

  buildConstraints(dsName) {
    let ds = this.app.dataSources[dsName];
    console.log('building up the constraints');
    let queries = [];
    this.app.modelDefinitions.forEach(function(item) {
      if (item.config.dataSource == 'postgres') {
        let op1 = item.name;
        for (var key in item.definition.relations) {
          let ref = item.definition.relations[key];
          let type = ref.type;
          let op2 = ref.model;

          let dst, src;
          switch (type) {
            case 'hasMany':
            case 'hasOne':
              dst = (ref.through === undefined) ? op2 : ref.through;
              src = op1;
              break;
            case 'belongsTo':
              dst = op1;
              src = op2;
              break;
            default:
              throw error('NOT (yet) HANDLED constraint: ' + type);
          }

          let fk = (ref.foreignKey === '') ? src + 'Id' : ref.foreignKey;
          let query = 'ALTER TABLE "' + dst.toLowerCase() + '" ADD CONSTRAINT ' + op1 + '_' + type + '_' + op2 + ' FOREIGN KEY (' + fk + ') REFERENCES "' + src.toLowerCase() + '"( id );';
          queries.push(query);
        };
      }
    });

    var promises = queries.map((x) => new Promise((resolve, reject) => ds.connector.execute(x, [], function(err, result) { if (err) { reject(err); } resolve(err); })));
    return Promise.all(promises);
  }
}
