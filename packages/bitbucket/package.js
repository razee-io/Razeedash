/* eslint-disable no-undef */
Package.describe({
    name: 'bitbucket',
    version: '0.1.0',
    summary: 'Login service for Bitbucket accounts',
});

Package.onUse(function(api) {
    api.versionsFrom('1.8.1');
    api.use('ecmascript');
    api.use('oauth2', ['client', 'server']);
    api.use('oauth', ['client', 'server']);
    api.use('random', 'client');
    api.use('service-configuration', ['client', 'server']);

    api.export('bitbucket');

    api.addFiles( ['bitbucket_configure.html', 'bitbucket_configure.js'], 'client');
    api.addFiles('bitbucket_server.js', 'server');
    api.addFiles('bitbucket_client.js', 'client');
    
    api.use('accounts-base', ['client', 'server']);
    api.imply('accounts-base', ['client', 'server']);
    api.use('accounts-oauth', ['client', 'server']);

    api.use('http', ['client', 'server']);
    api.use('templating', 'client');
    
    api.addFiles('bitbucket_login_button.css', 'client');
    api.addFiles('accounts-bitbucket.js');
});
