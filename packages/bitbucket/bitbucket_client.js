/* eslint-disable no-undef */
Bitbucket = {};

// Request Bitbucket credentials for the user
// @param options {optional}  XXX support options.requestPermissions
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Bitbucket.requestCredential = function (options, credentialRequestCompleteCallback) {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
        credentialRequestCompleteCallback = options;
        options = {};
    }

    var config = ServiceConfiguration.configurations.findOne({service: 'bitbucket'});
    if (!config) {
        credentialRequestCompleteCallback && credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError('Service not configured'));
        return;
    }

    const credentialToken = Random.secret();
    const loginStyle = OAuth._loginStyle('bitbucket', config, options);
    const redirectUrl = Meteor.absoluteUrl('_oauth/bitbucket?close&state=' + credentialToken);
    const state = OAuth._stateParam(loginStyle, credentialToken, redirectUrl);
    const loginUrl = 'https://bitbucket.org/site/oauth2/authorize' + 
                     `?client_id=${config.consumerKey}` + 
                     '&response_type=code' +
                     `&state=${state}`;

    OAuth.launchLogin({
        loginService: 'bitbucket',
        loginStyle,
        loginUrl,
        credentialRequestCompleteCallback,
        credentialToken,
        popupOptions: {width: 900, height: 450}
    });
   
};
