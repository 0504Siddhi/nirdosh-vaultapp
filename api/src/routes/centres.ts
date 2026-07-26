import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  searchCentresByCity,
  searchCentresByPin,
  searchCentresByLocation,
  getAvailableCities,
} from '../services/nearbyCentreService';

const router = Router();

/**
 * GET /api/v1/centres?city=Delhi
 * GET /api/v1/centres?pin=110001
 * GET /api/v1/centres?lat=28.6&lng=77.2
 *
 * Returns list of nearby assistance centres.
 * Authentication optional for this endpoint.
 */
router.get('/', (req, res: Response): void => {
  const { city, pin, lat, lng } = req.query;

  if (lat && lng) {
    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);
    if (isNaN(latNum) || isNaN(lngNum)) {
      res.status(400).json({ error: 'Invalid lat/lng values' });
      return;
    }
    const centres = searchCentresByLocation(latNum, lngNum);
    res.json({ centres, searchMethod: 'geolocation' });
    return;
  }

  if (city) {
    const centres = searchCentresByCity(city as string);
    res.json({ centres, searchMethod: 'city' });
    return;
  }

  if (pin) {
    const centres = searchCentresByPin(pin as string);
    res.json({ centres, searchMethod: 'pin' });
    return;
  }

  // No search params — return available cities
  const cities = getAvailableCities();
  res.json({ cities, centres: [], searchMethod: 'none' });
});

export default router;
