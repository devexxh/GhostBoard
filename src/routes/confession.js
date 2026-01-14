import { Router } from "express";
import { confessionSchema } from "../schemas/confession.js";
import { voteSchema } from "../schemas/vote.js";
import { Confession } from "../models/Confession.js";

const confessionRouter = Router();

confessionRouter.post("/", async (req, res) => {
    const parsed = confessionSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json(parsed.error.z.treeifyError());
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

export default confessionRouter;