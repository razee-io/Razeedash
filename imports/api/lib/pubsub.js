var _ = require('lodash');
var Redis = require('ioredis');

var getNewClient = ()=>{
    var conf = JSON.parse(process.env.REDIS_CONN_JSON || '{}');
    return new Redis(conf);
};
var redisClient = getNewClient();
var subClient = getNewClient();

var getQueueName = (chanName)=>{
    return `pubsub_queue_${chanName}`;
};

var pub = async(chanName, msg, options={})=>{
    var { type='fanout', maxQueueSize=100 } = options;

    msg = JSON.stringify(msg);

    if(type == 'fanout'){
        return await pubFanout(chanName, msg);
    }
    else if(type == 'roundRobin'){
        return await pubRoundRobin(chanName, msg, maxQueueSize);
    }
    else{
        throw `unknown type "${type}"`;
    }
};

var pubFanout = async(chanName, msg)=>{
    return await redisClient.publish(chanName, msg);
};

var pubRoundRobin = async(chanName, msg, maxQueueSize)=>{
    // todo: make the sub() part of this function
    await (redisClient.pipeline()
        .lpush(getQueueName(chanName), msg)
        .ltrim(getQueueName(chanName), 0, maxQueueSize)
        .publish(chanName, '1')
    ).exec();
};

var unsub = (obj)=>{
    chanNamesToSubs[obj.chanName].delete(obj);
    if(chanNamesToSubs[obj.chanName].size < 1){
        subClient.unsubscribe(obj.chanName);
    }
};

var sub = (chanName, filters=[], onMsg=null)=>{
    if(!onMsg){
        if(filters.length < 1){
            throw 'please supply (chanName, onMsg) or (chanName, filters, onMsg)';
        }
        onMsg = filters;
        filters = [];
    }
    var obj = {
        filters,
        onMsg,
        chanName,
    };
    obj.unsubscribe = ()=>{
        unsub(obj);
    };
    chanNamesToSubs[chanName] = chanNamesToSubs[chanName] || new Set();
    chanNamesToSubs[chanName].add(obj);
    subClient.subscribe(chanName);
    return obj;
};

var chanNamesToSubs = {};

subClient.on('message', async(chanName, pubMsg)=>{
    var msg = pubMsg;
    msg = JSON.parse(msg);
    var listeners = chanNamesToSubs[chanName];
    if(!listeners){
        return;
    }
    listeners.forEach((obj)=>{
        if(!_.every(obj.filters, msg)){
            return;
        }
        obj.onMsg(msg);
    });
});

module.exports = {
    pub, sub,
};
