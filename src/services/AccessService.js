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
    console.log(row, "lcoation");

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

  // type_components is a global catalog: any authenticated user may reference any
  // type. This only checks the referenced type actually exists.
  static async validateTypeComponentAccess({ typeComponentId }) {
    const query = `SELECT * FROM type_components WHERE id = $1`;
    const result = await pool.query(query, [typeComponentId]);

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0];
  }

  static async validateTypeContainerAccess({ typeContainerId, userId }) {
    console.log(
      typeContainerId,
      userId,
      "asssssssssssssssssssssssssssssssssssssss",
    );
    const query = `
     SELECT tc.*
      FROM type_containers tc
      JOIN brands b ON tc.brand_id = b.id
      WHERE tc.id = $1
        AND b.user_id = $2;
    `;

    const values = [typeContainerId, userId];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return null;
    }
    console.log(result.rows[0]);

    return result.rows[0];
  }

  // Validate that a component is a usable ESSENCE for this user: active, owned by
  // the user's brand, and of the global type flagged with code = 'ESSENCE'.
  static async validateEssenceComponent({ componentId, userId }) {
    const query = `
      SELECT c.*
      FROM components c
      JOIN brands b ON c.brand_id = b.id
      JOIN type_components tc ON tc.id = c.type_component_id
      WHERE c.id = $1
        AND b.user_id = $2
        AND c.state = true
        AND tc.code = 'ESSENCE';
    `;
    const result = await pool.query(query, [componentId, userId]);

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0];
  }

  static async validateComponentAccess({ componentId, userId }) {
    const query = `
     SELECT c.*
      FROM components c
      JOIN brands b ON c.brand_id = b.id
      WHERE c.id = $1
        AND b.user_id = $2
        AND c.state ;
    `;
    const values = [componentId, userId];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return null;
    }
    console.log(result.rows[0]);

    return result.rows[0];
  }

  static async validateContainerAccess({ containerId, userId }) {
    const query = `
     SELECT c.*
      FROM containers c
      JOIN brands b ON c.brand_id = b.id
      WHERE c.id = $1
        AND b.user_id = $2;
    `;
    const values = [containerId, userId];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return null;
    }
    console.log(result.rows[0]);

    return result.rows[0];
  }
}
