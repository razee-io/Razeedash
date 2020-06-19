
import './labelSelect.html';
import { Template } from 'meteor/templating';
// eslint-disable-next-line no-unused-vars
import selectpicker from 'bootstrap-select';

Template.LabelSelect.onRendered( () => {
    $('.js-labels-select').selectpicker();
});

Template.LabelOption.helpers({
    selectStatus() {
    // when editing a subscription, this  puts checks on the 
    // items in the dropdown that are already selected
        let selected = '';
        if(this.subscription && this.subscription.tags) {
            this.subscription.tags.map( (tag) => {
                if(tag === this.label.name) {
                    selected='selected';
                } 
            });
        }
        return selected;
    },
});
