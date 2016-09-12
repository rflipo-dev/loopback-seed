# Loopback-seed

This package allows you to seed your database(s).

Only tested on POSTGRES for now, tests and more datasources coming soon.

## Install
```
$ npm install loopback-seed --save
```

In your component-config.json add :
````
"loopback-seed": {
    "datasource": "postgres",
    "fakerLocale": "fr" // optionnal, default is us
}
````


* Create a 'database' folder at the root of your project.
* Create a 'factories.js' file inside
* Create seed.${env}.js files (as many envs as you wish)

## Factories
This package use FakerJS for massive data creation.

Add factories for all the datas you want to seed.

**In factories.js** :
```
import app from '../server/server'; // var app = require('../server/server');

app.seeder.createFactory('User', {
  'firstname': '{{name.firstName}}',
  'lastname': '{{name.lastName}}',
  'email': '{{internet.email}}',
  'password': '{{internet.password}}',
  'birthdate': '{{date.past(50)}}',
});
```

## Use your factories
In your seeds file

**Ex in seed.dev.js** :
```
import app from '../server/server'; // var app = require('../server/server');

app.seeder.migrate('User'); // will generate 1 user

app.seeder.migrate('User', 20); // will generate 20 users

app.seeder.migrate('User', 5, {
    firstname: 'Roger'
}); // will generate 5 users named Roger
```
all app.seeder function returns promises.
```
app.seeder.migrate('User', 10)
    .then((users) => app.seeder.migrate('Article', 20))
    .then((articles) => ...
```

## Utils
* reset your DB :
```
app.seeder.reset()
    .then(() => app.seeder.migrate('User'));
```
* close your connector :
```
app.seeder.reset()
    .then(() => app.seeder.migrate('User'))
    .then(() => app.seeder.end();
```
* Build Db constraints (Postgres only)
```
app.seeder.buildConstraints('postgres'))
```


## Launch your migrations
So we don't have a command line tool here :'(

Advices : 
* Create a 'database/migrate.js' file.
````
import app from '../server/server';

app.seeder.migrateAll();
````
Depending on your current env, it will migrate one of your seed.${env}.js file.

**If no env is provided, it will look for seed.default.js**

You can pass an env as string to override the default behaviour :
````
app.seeder.migrateAll('dev');
````
* add a script in your package.json :
````
"scripts": {
    "db": "babel-node database/migrate.js" // !es6 => "node database/migrate.js"
}
````
