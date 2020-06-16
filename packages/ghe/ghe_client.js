/* eslint-disable no-undef */

Ghe = {};

// Request Github credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Ghe.requestCredential = function(options, credentialRequestCompleteCallback) {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
        credentialRequestCompleteCallback = options;
        options = {};
    }

    const config = ServiceConfiguration.configurations.findOne({ service: 'ghe' });
    if (!config) {
        credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());
        return;
    }
    const credentialToken = Random.secret();

    const scope = (options && options.requestPermissions) || ['user:email'];
    const flatScope = _.map(scope, encodeURIComponent).join('+');

    const loginStyle = OAuth._loginStyle('ghe', config, options);

    let url = config.gheURL;
    const httpCheck = /^((http|https):\/\/)/;
    if(!httpCheck.test(config.gheURL)) {
        url = `https://${config.gheURL}`;
    }

    const trailingSlash = /\/*$/gi;
    const gheUrl = url.replace(trailingSlash, '');

    const loginUrl =
        gheUrl + '/login/oauth/authorize' +
        '?client_id=' + config.clientId +
        '&scope=' + flatScope +
        '&redirect_uri=' + OAuth._redirectUri('ghe', config) +
        '&state=' + OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl);
        
    OAuth.launchLogin({
        loginService: 'ghe',
        loginStyle,
        loginUrl,
        credentialRequestCompleteCallback,
        credentialToken,
        popupOptions: {
            width: 900,
            height: 450
        }
    });

};
