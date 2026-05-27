import { pool } from "../config/db.js";
import { BrandModel } from "../models/brandModel.js";
import { LocationModel } from "../models/locationModel.js";

export class AccessService {
  // static async getUserBrandAndLocatio(userId, locationId) {
  //   if (!userId) {
  //     throw { status: 400, message: "User not provided" };
  //   }

  //   const brand = await BrandModel.viewBrand({ userId });

  //   if (!brand) {
  //     throw { status: 404, message: "Brand not found" };
  //   }

  //   const location = await LocationModel.retrieveLocation({
  //     id: locationId,
  //     brand_id: brand.id,
  //   });

  //   if (!location) {
  //     throw { status: 404, message: "Location not found" };
  //   }
  //   return { brand, location };
  // }

  static async getUserBrandAndLocation(userId, locationId) {
    if (!userId) {
      throw { status: 400, message: "User not provided" };
    }

    const query = `
    SELECT l.*, b.*
    FROM locations l
    JOIN brands b ON l.brand_id = b.id
    WHERE l.id = $1
      AND b.user_id = $2
  `;

    const result = await pool.query(query, [locationId, userId]);
    console.log(result.rows[0]);

    if (result.rowCount === 0) {
      throw { status: 403, message: "Access denied or location not found" };
    }

    const row = result.rows[0];

    return {
      location: {
        id: locationId,
        name: row.name,
        address: row.address,
        brand_id: row.brand_id,
      },
      brand: {
        id: row.brand_id,
        user_id: row.user_id,
      },
    };
  }

  // Validate if the type component belongs of user session
  static async validateTypeComponentAccess({ typeComponentId, userId }) {
    console.log(
      typeComponentId,
      userId,
      "asssssssssssssssssssssssssssssssssssssss",
    );
    const query = `
     SELECT tc.*
      FROM type_components tc
      JOIN brands b ON tc.brand_id = b.id
      WHERE tc.id = $1
        AND b.user_id = $2;
    `;

    const values = [typeComponentId, userId];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return null;
    }
    console.log(result.rows[0]);

    return result.rows[0];
  }

  static async validateComponentAccess({ componentId, userId }) {
    const query = `
     SELECT c.*
      FROM components c
      JOIN brands b ON c.brand_id = b.id
      WHERE c.id = $1
        AND b.user_id = $2;
    `;
    const values = [componentId, userId];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return null;
    }
    console.log(result.rows[0]);

    return result.rows[0];
  }
}
