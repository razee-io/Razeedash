/* eslint-disable no-undef */
// based off of https://github.com/meteor/meteor/blob/devel/packages/accounts-github/github.js

Accounts.oauth.registerService('bitbucket');

if (Meteor.isClient) {
    const loginWithBitbucket = (options, callback) => {
        // support a callback without options
        if (! callback && typeof options === 'function') {
            callback = options;
            options = null;
        }

        const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
        Bitbucket.requestCredential(options, credentialRequestCompleteCallback);
    };
    Accounts.registerClientLoginFunction('bitbucket', loginWithBitbucket);
    Meteor.loginWithBitbucket = (...args) => Accounts.applyLoginFunction('bitbucket', args);
} else {
    Accounts.addAutopublishFields({
        forLoggedInUser: ['services.bitbucket'],
        forOtherUsers: ['services.bitbucket.username']
    });
}
