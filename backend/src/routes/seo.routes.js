import express from 'express';
import { getSitemap, getRobots } from '../controllers/seo.controller.js';

const router = express.Router();

router.get('/sitemap.xml', getSitemap);
router.get('/robots.txt', getRobots);

export default router;
