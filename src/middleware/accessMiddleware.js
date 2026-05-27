import { pool } from "../config/db.js";
import { AccessService } from "../services/AccessService.js";

//Validate if the location provied belongs the user of session
export const validateLocationAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let locationId;

    if (req.body?.location_id) {
      // ✅ optional chaining
      locationId = Number(req.body.location_id);
    } else if (req.query?.id) {
      // ✅ optional chaining
      locationId = Number(req.query.id);
    } else if (req.params?.id) {
      // ✅ optional chaining
      locationId = Number(req.params.id);
    }

    if (!locationId || isNaN(locationId)) {
      return res.status(400).json({
        error: "Invalid location ID",
      });
    }

    const { location } = await AccessService.getUserBrandAndLocation(
      userId,
      locationId,
    );

    req.location = location;

    next();
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.message,
    });
  }
};

//Validate if the user has brand and return brand
export const validateBrandAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT *
      FROM brands
      WHERE user_id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rowCount === 0) {
      return res.status(403).json({
        error: "Access denied or brand not found",
      });
    }

    req.brand = result.rows[0];

    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

//Validate if the component provied belongs the user of session
export const validateComponentAccess = async (req, res, next) => {
  try {
    const componentId = Number(req.body.component_id);
    const { id: userId } = req.user;

    if (!componentId || isNaN(componentId) || !userId || isNaN(userId)) {
      return res.status(400).json({
        error: "Invalid component ID or user ID",
      });
    }

    const component = await AccessService.validateComponentAccess({
      componentId,
      userId,
    });

    if (!component) {
      return res.status(404).json({
        error: "Component not found",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};
