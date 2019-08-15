/* eslint-disable no-undef */

Bitbucket = {};

OAuth.registerService('bitbucket', 2, null, query => {
    const accessToken = getAccessToken(query);
    const identity = getIdentity(accessToken);
    console.log(identity);
    return {
        serviceData: {
            id: identity.account_id,
            accessToken: OAuth.sealSecret(accessToken),
            username: identity.username
        },
        options: { 
            profile: {
                name: identity.display_name

            }
        }
    };
});

let userAgent = 'Meteor';
if (Meteor.release) {
    userAgent += `/${Meteor.release}`;
}

const getAccessToken = (query) => {
    const config = ServiceConfiguration.configurations.findOne({service: 'bitbucket'});
    if (!config) {
        throw new ServiceConfiguration.ConfigError();
    }

    let response;
    try {
        response = HTTP.post(
            'https://bitbucket.org/site/oauth2/access_token', {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': userAgent
                },
                params: {
                    code: query.code,
                    grant_type: 'authorization_code',
                    client_id: config.consumerKey,
                    client_secret: OAuth.openSecret(config.secret)
                }
            });
    } catch (err) {
        throw Object.assign( 
            new Error(`Failed to complete OAuth handshake with Bitbucket. ${err.message}`), { response: err.response },
        );
    }
    if (response.data.error) {
        throw new Error(`Failed to complete OAuth handshake with Bitbucket. ${response.data.error}`);
    } else {
        return response.data.access_token;
    }
};

const getIdentity = (accessToken) => {
    try {
        return HTTP.get(
            'https://bitbucket.org/api/2.0/user', {
                headers: {
                    'User-Agent': userAgent,
                    Authorization: 'Bearer ' + accessToken
                }, 
            }).data;
    } catch (err) {
        throw Object.assign(
            new Error(`Failed to fetch identity from Bitbucket. ${err.message}`), { response: err.response },
        );
    }
};

Bitbucket.retrieveCredential = (credentialToken, credentialSecret) => {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
