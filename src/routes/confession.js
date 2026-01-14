import { Router } from "express";
import { confessionSchema } from "../schemas/confession.js";
import { Confession } from "../models/Confession.js";

const confessionRouter = Router();

confessionRouter.post("/", async (req, res) => {
    const parsed = confessionSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json(parsed.error.z.treeifyError());
    }

    const confession = await Confession.create({
        ...parsed.data,
        votes: []
    });

    res.json(confession);
});

export default confessionRouter;