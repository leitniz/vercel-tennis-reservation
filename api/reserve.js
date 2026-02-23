/**
 * Vercel Serverless Function - SECURED VERSION
 * Tennis Reservation System with API Key + Rate Limiting
 *
 * Environment Variables (set in Vercel Dashboard):
 * - EMAIL: Your Nacional Club Social email
 * - PASSWORD: Your password
 * - GUEST_ID: Cédula del invitado
 * - API_KEY: Secret key for authentication (REQUIRED)
 *
 * Security Features:
 * ✅ API Key authentication
 * ✅ Rate limiting (10 requests/minute per key)
 * ✅ Request logging
 * ✅ IP tracking
 */

// API Configuration
const API_BASE_URL = 'https://api-agenda.nacionalclubsocial.uy';
const ACTIVITY_ID = 54;

// Rate limiting storage (in-memory)
const rateLimit = new Map();

/**
 * Check if request is within rate limit
 */
function checkRateLimit(identifier, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimit.get(identifier) || [];

  // Remove old requests outside the time window
  const validRequests = userRequests.filter(time => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  validRequests.push(now);
  rateLimit.set(identifier, validRequests);
  return true;
}

/**
 * Make HTTP request to the reservation API
 */
async function makeRequest(method, endpoint, body = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error(`Network error: Unable to connect to ${url}`);
    }
    throw error;
  }
}

/**
 * Login and get authentication token
 */
async function login(email, password) {
  const data = await makeRequest('PUT', '/signin', {
    user: email,
    password: password
  });

  const userId = data.user_files?.[0]?.userId || data.userId || data.id;

  if (!userId) {
    throw new Error('Login failed: Could not retrieve user ID');
  }

  return {
    token: data.token,
    userId: userId
  };
}

/**
 * Get available time slots
 */
async function getAvailableSlots(token, userId, dayOfWeek) {
  const endpoint = `/activitytime/?id=${ACTIVITY_ID}&dow=${dayOfWeek}&userId=${userId}`;
  const data = await makeRequest('GET', endpoint, null, token);
  return data.description || [];
}

/**
 * Find best available slot
 */
function findBestSlot(slots, preferredTimes, preferredLocations) {
  const available = slots.filter(s => s.TotalReservations === 0);

  if (available.length === 0) {
    return null;
  }

  for (const time of preferredTimes) {
    const matchingTime = available.filter(s => s.starttime === time);

    if (matchingTime.length > 0) {
      for (const location of preferredLocations) {
        const exactMatch = matchingTime.find(s => s.location === location);
        if (exactMatch) {
          return exactMatch;
        }
      }
      return matchingTime[0];
    }
  }

  return available[0];
}

/**
 * Make a reservation
 */
async function makeReservation(token, userId, activityTimeId, daysAhead, guestId) {
  return await makeRequest('POST', '/reservation/', {
    usr: userId,
    at: activityTimeId,
    day: daysAhead,
    description: guestId
  }, token);
}

/**
 * Get all reservations
 */
async function getReservations(token) {
  const data = await makeRequest('GET', '/reservation/', null, token);
  return data.description || [];
}

/**
 * Cancel a reservation
 */
async function cancelReservation(token, reservationId) {
  await makeRequest('DELETE', `/reservation/?id=${reservationId}`, null, token);
}

/**
 * Vercel Serverless Function Handler - SECURED
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Logging
  const logs = [];
  const log = (...args) => {
    const message = args.join(' ');
    logs.push(message);
    console.log(message);
  };

  try {
    log('🚀 Tennis Reservation Automation Started (SECURED)');
    log(`⏰ Time: ${new Date().toISOString()}`);

    // Get client info for logging
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        'unknown';
    log(`📍 Client IP: ${clientIp}`);

    // 🔐 SECURITY LAYER 1: API KEY AUTHENTICATION
    const providedKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY;

    if (!validKey) {
      log('⚠️  WARNING: API_KEY not configured in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: API_KEY not set'
      });
    }

    if (!providedKey) {
      log(`❌ Unauthorized attempt from IP: ${clientIp} - Missing API key`);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: API key required',
        hint: 'Include X-API-Key header in your request'
      });
    }

    if (providedKey !== validKey) {
      log(`❌ Unauthorized attempt from IP: ${clientIp} - Invalid API key: ${providedKey.substring(0, 10)}...`);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid API key'
      });
    }

    log('✅ API key validated');

    // 🚦 SECURITY LAYER 2: RATE LIMITING
    const identifier = `${providedKey.substring(0, 16)}`; // Use first 16 chars of key as identifier

    if (!checkRateLimit(identifier, 10, 60000)) {
      log(`⚠️  Rate limit exceeded for key: ${identifier}... from IP: ${clientIp}`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: 60,
        limit: '10 requests per minute'
      });
    }

    log('✅ Rate limit check passed');

    // Get credentials from environment
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;
    const defaultGuestId = process.env.GUEST_ID || '';

    if (!email || !password) {
      throw new Error('Missing EMAIL or PASSWORD environment variables');
    }

    // Parse request
    const params = req.method === 'POST' ? req.body : req.query;

    const {
      action = 'AUTO_RESERVE',
      dayOfWeek = '1',
      daysAhead = '1',
      preferredTimes = '19:00',
      preferredLocations = 'Cancha de Tenis 2',
      guestId = defaultGuestId,
      reservationId = null
    } = params;

    const prefTimes = preferredTimes.split(',').map(t => t.trim());
    const prefLocations = preferredLocations.split(',').map(l => l.trim());

    log(`📋 Action: ${action}`);
    log(`📅 Day of Week: ${dayOfWeek}`);

    // Login
    log('🔐 Logging in to ...');
    const { token, userId } = await login(email, password);
    log(`✅ Login successful! User: ${userId}`);

    let result = {};

    // Execute action
    switch (action.toUpperCase()) {
      case 'AUTO_RESERVE':
        log('🎾 AUTO RESERVE MODE');
        const slots = await getAvailableSlots(token, userId, parseInt(dayOfWeek));
        log(`Found ${slots.length} total slots`);

        const bestSlot = findBestSlot(slots, prefTimes, prefLocations);

        if (!bestSlot) {
          log('❌ No suitable slots available');
          result = {
            success: false,
            message: 'No available slots matching preferences',
            totalSlots: slots.length,
            availableSlots: 0
          };
        } else {
          log(`🎯 Best slot: ${bestSlot.starttime} at ${bestSlot.location}`);
          const reservation = await makeReservation(
              token, userId, bestSlot.id, parseInt(daysAhead), guestId
          );
          log('✅ Reservation completed!');
          result = {
            success: true,
            message: 'Reservation completed',
            slot: { time: bestSlot.starttime, location: bestSlot.location },
            reservation
          };
        }
        break;

      case 'CHECK_SLOTS':
        log('🔍 CHECK SLOTS MODE');
        const allSlots = await getAvailableSlots(token, userId, parseInt(dayOfWeek));
        const available = allSlots.filter(s => s.TotalReservations === 0);
        log(`Total: ${allSlots.length}, Available: ${available.length}`);

        result = {
          success: true,
          totalSlots: allSlots.length,
          availableSlots: available.length,
          slots: allSlots.map(s => ({
            id: s.id,
            time: s.starttime,
            location: s.location,
            available: s.TotalReservations === 0
          }))
        };
        break;

      case 'VIEW_RESERVATIONS':
        log('📋 VIEW RESERVATIONS MODE');
        const reservations = await getReservations(token);
        log(`Found ${reservations.length} reservations`);

        result = {
          success: true,
          count: reservations.length,
          reservations: reservations.map(r => ({
            id: r.id,
            activity: r.activityName || r.name,
            location: r.location,
            datetime: r.reservationdate,
            time: r.starttime
          }))
        };
        break;

      case 'CANCEL_RESERVATION':
        if (!reservationId) {
          throw new Error('reservationId required');
        }
        log(`❌ CANCEL RESERVATION: ${reservationId}`);
        await cancelReservation(token, reservationId);
        log('✅ Canceled successfully');

        result = {
          success: true,
          message: 'Reservation canceled',
          reservationId
        };
        break;

      default:
        throw new Error(`Invalid action: ${action}`);
    }

    log('✅ Script completed successfully');

    return res.status(200).json({
      ...result,
      logs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    log(`❌ Error: ${error.message}`);

    return res.status(500).json({
      success: false,
      error: error.message,
      logs,
      timestamp: new Date().toISOString()
    });
  }
}
