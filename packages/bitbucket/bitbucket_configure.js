/* eslint-disable no-undef */
Template.configureLoginServiceDialogForBitbucket.helpers({
    // Bitbucket doesn't recognize localhost as a domain name
    siteUrl() {
        return Meteor.absoluteUrl({replaceLocalhost: true});
    } 
});

Template.configureLoginServiceDialogForBitbucket.fields = function () {
    return [
        {property: 'consumerKey', label: 'Key'},
        {property: 'secret', label: 'Secret'}
    ];
};
