import { Channels } from '../deployables/channels/channels.js';
import { Stats } from './stats.js';

export const updateDeployablesCountStat = (orgId)=>{
    const count = Channels.find({org_id: orgId}).count();
    Stats.upsert({ orgId }, { $set: { deployablesCount: count } });
};
