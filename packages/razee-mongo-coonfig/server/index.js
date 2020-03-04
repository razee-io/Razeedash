import { Mongo } from 'meteor/mongo';

// ex: export MONGO_OPTIONS='{"ssl": true}'

const mongoOptionStr = process.env.MONGO_OPTIONS;
if (typeof mongoOptionStr !== 'undefined') {
    const mongoOptions = JSON.parse(mongoOptionStr);
    Mongo.setConnectionOptions(mongoOptions);
}
