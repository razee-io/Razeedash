/* eslint-disable no-undef */

Package.describe({
    summary: 'Github Enterprise OAuth flow',
    version: '3.0.0',
    name: 'ibmcloud:accounts-ghe',
    documentation: null
});

Package.onUse(function(api) {
    api.use('accounts-base', ['client', 'server']);
    api.use('ecmascript');
    api.imply('accounts-base', ['client', 'server']);
    api.use('accounts-oauth', ['client', 'server']);
    api.use('oauth2', ['client', 'server']);
    api.use('oauth', ['client', 'server']);
    api.use('http', ['client', 'server']);
    api.use('underscore', 'client');
    api.use('templating', 'client');
    api.use('random', 'client');
    api.use('service-configuration', ['client', 'server']);
    api.addFiles('ghe_login_button.css', 'client');
    api.addFiles('ghe.js');
    api.export('Ghe');
    api.addFiles(
        ['ghe_configure.html', 'ghe_configure.js'],
        'client');
    api.addFiles('ghe_server.js', 'server');
    api.addFiles('ghe_client.js', 'client');
});
