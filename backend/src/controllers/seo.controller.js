import { seoService } from '../services/seo.service.js';

export const getSitemap = async (req, res, next) => {
  try {
    const baseUrl = seoService.resolveBaseUrl(req);
    const xml = await seoService.generateSitemapXml(baseUrl);
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
};

export const getRobots = async (req, res, next) => {
  try {
    const baseUrl = seoService.resolveBaseUrl(req);
    const robots = seoService.generateRobotsTxt(baseUrl);
    res.header('Content-Type', 'text/plain; charset=utf-8');
    res.header('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(robots);
  } catch (error) {
    next(error);
  }
};
