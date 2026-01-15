import { GhostActivity } from "../models/GhostActivity.js";

export const checkGhostLimits = async (ghostId, type) => {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);

    let activity = await GhostActivity.findOne({ ghostId });
    if (!activity) {
        activity = await GhostActivity.create({
            ghostId,
            confessionTime: [],
            voteTime: []
        });
    }

    if (type === 'confession') {
        activity.confessionTime = activity.confessionTime.filter(t => t > windowStart);

        if (activity.confessionTime.length >= 3) {
            return false;
        }
        activity.confessionTime.push(now);
    }

    if (type === 'vote') {
        activity.voteTime = activity.voteTime.filter(t => t > windowStart);
        if (activity.voteTime.length >= 10) {
            return false;
        }
        activity.voteTime.push(now);
    }
    await activity.save();
    return true;
}