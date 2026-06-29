import { pool } from "../../config/db.js";

export class ContainerModel {
  static async createContainer({ brand_id, params, newMeasures, userId }) {
    console.log(
      params,
      brand_id,
      newMeasures,
      "--------------------------------",
    );
    const query =
      "INSERT INTO containers (name , capacity, unit,type_Container_id, brand_id,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *";
    const values = [
      params.name,
      newMeasures.quantityInBase,
      newMeasures.units,
      params.type_container,
      brand_id,
      userId,
    ];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async updateContainer({ brandId, params, newMeasures, userId }) {
    const query = `
  UPDATE containers
  SET 
    name = COALESCE($1, name),
    capacity = COALESCE($2, capacity),
    unit = COALESCE($3, unit),
    type_container_id = COALESCE($4, type_container_id),
    created_by = COALESCE(created_by),
    updated_by = $5
  WHERE brand_id = $6   
    AND id = $7
  RETURNING *;
`;

    const values = [
      params.name,
      newMeasures?.quantityInBase,
      newMeasures?.units,
      params.type_container,
      userId,
      brandId,
      params.id,
    ];

    const result = await pool.query(query, values);
    console.log(result);

    return result.rows[0];
  }

  static async deleteContainer({ brandId, params }) {
    const query = `DELETE FROM Containers 
      WHERE id = $1 AND brand_id = $2
      RETURNING *;`;

    const values = [params.id, brandId];

    const result = await pool.query(query, values);

    return result.rows[0];
  }
  static async listContainer({
    brand_id,
    page = 1,
    limit = 10,
    name,
    capacity,
    type_container,
  }) {
    const offset = (page - 1) * limit;

    let query = `
    SELECT 
      c.*,
      tc.name AS type_container_name
    FROM containers c
    JOIN type_containers tc
      ON c.type_container_id = tc.id
    WHERE c.brand_id = $1
  `;

    const values = [brand_id];

    let index = 2;

    // FILTER NAME
    if (name) {
      query += ` AND c.name ILIKE $${index}`;
      values.push(`%${name}%`);
      index++;
    }

    // FILTER TYPE CONTAINER NAME
    if (type_container) {
      query += ` AND c.type_container_id = $${index}`;
      values.push(type_container);
      index++;
    }

    // FILTER CAPACITY
    if (capacity) {
      query += ` AND c.capacity = $${index}`;
      values.push(capacity);
      index++;
    }

    query += `
    ORDER BY c.id DESC
    LIMIT $${index}
    OFFSET $${index + 1}
  `;

    values.push(limit, offset);

    const resultQuery = await pool.query(query, values);

    // ---------------- COUNT QUERY ----------------

    let countQuery = `
    SELECT COUNT(*) AS total
    FROM containers c
    JOIN type_containers tc
      ON c.type_container_id = tc.id
    WHERE c.brand_id = $1
  `;

    const countValues = [brand_id];

    index = 2;

    if (name) {
      countQuery += ` AND c.name ILIKE $${index}`;
      countValues.push(`%${name}%`);
      index++;
    }

    if (type_container) {
      countQuery += ` AND c.type_container_id =$${index}`;
      countValues.push(type_container);
      index++;
    }

    if (capacity) {
      countQuery += ` AND c.capacity = $${index}`;
      countValues.push(capacity);
      index++;
    }

    const countResult = await pool.query(countQuery, countValues);

    return {
      data: resultQuery.rows,
      total: Number(countResult.rows[0].total),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult.rows[0].total) / limit),
    };
  }
}
