/* eslint-disable no-undef */

Template.configureLoginServiceDialogForGhe.helpers({
    siteUrl: function() {
        return Meteor.absoluteUrl();
    }
});

Template.configureLoginServiceDialogForGhe.fields = () => [
    { property: 'gheURL', label: 'GitHub Enterprise URL' }, 
    { property: 'clientId', label: 'Client ID' }, 
    { property: 'secret', label: 'Client Secret' }
];
