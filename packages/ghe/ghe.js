/* eslint-disable no-undef */

Accounts.oauth.registerService('ghe');

if (Meteor.isClient) {
    Meteor.loginWithGhe = function(options, callback) {
        // support a callback without options
        if (!callback && typeof options === 'function') {
            callback = options;
            options = null;
        }
        
        const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
        Ghe.requestCredential(options, credentialRequestCompleteCallback);
    };
} else {
    Accounts.addAutopublishFields({
        forLoggedInUser: ['services.ghe'],
        forOtherUsers: ['services.ghe.username']
    });
}
