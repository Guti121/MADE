import { pool } from '../config/db.js'
import { logger } from '../config/logger.js'
import { AccessService } from '../services/AccessService.js'

// First defined, non-empty value coerced to a finite number (else undefined).
const firstNumber = (...vals) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
  }
  return undefined
}

// Location id resolution is DELIBERATELY fixed per source and single-key:
//   POST/PUT bodies carry it as `location_id`; GET/DELETE query strings carry it
//   as `id`; route params as `id`. Never accept `location_id` from the query —
//   controllers read `id` there, and allowing both keys let a caller pass an
//   owned id to this check while a different `id` drove the model (cross-tenant
//   IDOR). Brand scoping in the models below is the second layer.
const resolveLocationId = (req) =>
  firstNumber(req.body?.location_id, req.query?.id, req.params?.id)

// Same key in every source, so no confusion is possible.
const resolveKeyed = (req, key) =>
  firstNumber(req.body?.[key], req.query?.[key], req.params?.[key])

// Validate that the referenced location belongs to the authenticated user.
// Attaches the resolved { location, brand } to req.
export const validateLocationAccess = async (req, res, next) => {
  try {
    const userId = req.user.id
    const locationId = resolveLocationId(req)

    if (!locationId) {
      return res.status(400).json({ error: 'Invalid location ID' })
    }

    const { location, brand } = await AccessService.getUserBrandAndLocation(
      userId,
      locationId
    )

    req.location = location
    req.brand = req.brand ?? brand
    next()
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ error: 'Access denied' })
    }
    logger.error({ err: error }, 'validateLocationAccess failed')
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Validate that the authenticated user owns a brand; attaches it to req.brand.
export const validateBrandAccess = async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      'SELECT * FROM brands WHERE user_id = $1',
      [userId]
    )

    if (result.rowCount === 0) {
      return res.status(403).json({ error: 'Access denied or brand not found' })
    }

    req.brand = result.rows[0]
    next()
  } catch (error) {
    logger.error({ err: error }, 'validateBrandAccess failed')
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Validate that the referenced component belongs to the authenticated user.
export const validateComponentAccess = async (req, res, next) => {
  try {
    const componentId = resolveKeyed(req, 'component_id')
    const { id: userId } = req.user

    if (!componentId) {
      return res.status(400).json({ error: 'Invalid component ID' })
    }

    const component = await AccessService.validateComponentAccess({
      componentId,
      userId
    })

    if (!component) {
      return res.status(404).json({ error: 'Component not found' })
    }

    req.component = component
    next()
  } catch (error) {
    logger.error({ err: error }, 'validateComponentAccess failed')
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Validate that the referenced container belongs to the authenticated user.
export const validateContainerAccess = async (req, res, next) => {
  try {
    const containerId = resolveKeyed(req, 'container_id')
    const { id: userId } = req.user

    if (!containerId) {
      return res.status(400).json({ error: 'Invalid container ID' })
    }

    const container = await AccessService.validateContainerAccess({
      containerId,
      userId
    })

    if (!container) {
      return res.status(404).json({ error: 'container not found' })
    }

    req.container = container
    next()
  } catch (error) {
    logger.error({ err: error }, 'validateContainerAccess failed')
    return res.status(500).json({ error: 'Internal server error' })
  }
}
