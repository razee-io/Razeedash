/* eslint-disable no-undef */
// based off of the mongo-config from https://github.com/RocketChat/Rocket.Chat/tree/develop/packages/rocketchat-mongo-config

Package.describe({
    name: 'razee:mongo-config',
    version: '0.1.0',
    summary: 'Set mongo connection string options using an env variable'
});

Package.onUse(function(api) {
    api.use([
        'ecmascript',
        'mongo'
    ]);

    api.mainModule('server/index.js', 'server');
});
