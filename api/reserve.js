/**
 * Vercel Serverless Function - Tennis Reservation System
 * 
 * This function automates tennis court reservations for Nacional Club Social.
 * Uses native fetch API (Node 18+), no external dependencies required.
 * 
 * Environment Variables (set in Vercel Dashboard):
 * - EMAIL: Your Nacional Club Social email
 * - PASSWORD: Your password
 * - GUEST_ID: Cédula del invitado (optional, can be passed in request)
 * 
 * Supported Actions:
 * - AUTO_RESERVE: Automatically find and reserve best available slot
 * - CHECK_SLOTS: View available time slots without reserving
 * - VIEW_RESERVATIONS: List all your current reservations
 * - CANCEL_RESERVATION: Cancel a specific reservation by ID
 */

// API Configuration
const API_BASE_URL = 'https://api-agenda.nacionalclubsocial.uy';
const ACTIVITY_ID = 54; // Tennis

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
 * Get available time slots for a specific day
 */
async function getAvailableSlots(token, userId, dayOfWeek) {
  const endpoint = `/activitytime/?id=${ACTIVITY_ID}&dow=${dayOfWeek}&userId=${userId}`;
  const data = await makeRequest('GET', endpoint, null, token);
  return data.description || [];
}

/**
 * Find the best available slot based on preferences
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
  const data = await makeRequest('POST', '/reservation/', {
    usr: userId,
    at: activityTimeId,
    day: daysAhead,
    description: guestId
  }, token);
  
  return data;
}

/**
 * Get all current reservations
 */
async function getReservations(token) {
  const data = await makeRequest('GET', '/reservation/', null, token);
  return data.description || [];
}

/**
 * Cancel a reservation by ID
 */
async function cancelReservation(token, reservationId) {
  await makeRequest('DELETE', `/reservation/?id=${reservationId}`, null, token);
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    log('🚀 Tennis Reservation Automation Started');
    log(`⏰ Time: ${new Date().toISOString()}`);

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
      preferredTimes = '19:00,21:00',
      preferredLocations = 'Cancha de Tenis 2,Cancha de Tenis 5',
      guestId = defaultGuestId,
      reservationId = null
    } = params;

    const prefTimes = preferredTimes.split(',').map(t => t.trim());
    const prefLocations = preferredLocations.split(',').map(l => l.trim());

    log(`📋 Action: ${action}`);

    // Login
    log('🔐 Logging in...');
    const { token, userId } = await login(email, password);
    log(`✅ Login successful! User: ${userId}`);

    let result = {};

    switch (action.toUpperCase()) {
      case 'AUTO_RESERVE':
        log('🎾 AUTO RESERVE MODE');
        const slots = await getAvailableSlots(token, userId, parseInt(dayOfWeek));
        log(`Found ${slots.length} total slots`);
        
        const bestSlot = findBestSlot(slots, prefTimes, prefLocations);
        
        if (!bestSlot) {
          log('❌ No suitable slots available');
          result = { success: false, message: 'No available slots' };
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

    log('✅ Script completed');

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
