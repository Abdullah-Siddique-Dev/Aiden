import { Router } from "express";
import { PSL_SIGNS, CURRICULUM, ALL_ITEMS } from "../data/signs.js";

const router = Router();

router.get("/", (req, res) => res.json({ signs: PSL_SIGNS }));
router.get("/curriculum", (req, res) => res.json({ curriculum: CURRICULUM, signs: ALL_ITEMS }));

export default router;
