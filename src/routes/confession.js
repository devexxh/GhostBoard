import { Router } from "express";
import { confessionSchema } from "../schemas/confession.js";
import { voteSchema } from "../schemas/vote.js";
import { Confession } from "../models/Confession.js";
import { checkGhostLimits } from "../middlewares/rateLimit.js";


const confessionRouter = Router();

confessionRouter.post("/", async (req, res) => {
    const parsed = confessionSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json(parsed.error.z.treeifyError());
    }

    const allowed = await checkGhostLimits(parsed.data.ghostId, "confession");
    if (!allowed) {
        return res.status(429).json({ error: "Too many confessions. Try later." });
    }

    const confession = await Confession.create({
        ...parsed.data,
        vote: []
    });

    res.json(confession);
});

confessionRouter.post("/:id/vote", async (req, res) => {
    const parsed = voteSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(parsed.error.z.treeifyError());
    }
    const { ghostId, value } = parsed.data;
    const confessionId = req.params.id;

    const confession = await Confession.findById(confessionId);
    if (!confession) return res.status(404).json({ error: "Confession not found" });

    const allowed = await checkGhostLimits(ghostId, "vote");
    if (!allowed) {
        return res.status(429).json({ error: "Too many votes" });
    }

    const existing = confession.vote.find(v => v.ghostId === ghostId);
    if (value === 0) {
        confession.vote = confession.vote.filter(v => v.ghostId !== ghostId);
        await confession.save();
        return res.json({ status: "neutralized" });
    }
    if (existing) {
        existing.value = value;
    } else {
        confession.vote.push({ ghostId, value });
    }
    await confession.save();
    res.json({ status: "updated" });
});

confessionRouter.get("/feed", async (req, res) => {
    const now = new Date();
    const feed = await Confession.aggregate([
        {
            $match: { isHidden: false }
        },
        {
            $addFields: {
                score: { $sum: "$vote.value" },
                ageInHours: {
                    $divide: [
                        { $subtract: [now, "$createdAt"] },
                        1000 * 60 * 60
                    ]
                }
            }
        }, {
            $addFields: {
                rank: {
                    $divide: [
                        "$score",
                        { $sqrt: { $add: ["$ageInHours", 1] } }
                    ]
                }
            }
        }, {
            $sort: { rank: -1 }
        }, {
            $limit: 50
        }
    ]);

    res.json(feed);
});

confessionRouter.post("/:id/report", async (req, res) => {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json(parsed.error.format());
    }
    const { ghostId } = parsed.data;
    const confession = await Confession.findById(req.params.id);
    if (!confession) return res.status(404).json({ error: "Confession not found" });

    const alreadyReported = confession.reports.find(r => r.ghostId === ghostId);
    if (alreadyReported) {
        return res.status(400).json({ error: "You have already reported this confession." });
    }
    confession.reports.push({ ghostId });
    if (confession.reports.length >= 5) {
        confession.isHidden = true;
    }
    await confession.save();
    res.json({ status: "reported", hidden: confession.isHidden });
});

export default confessionRouter;