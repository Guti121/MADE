import { pool } from "../../config/db.js";

export class SaleModel {
  static async createSale(client, data) {
    const query = `
      INSERT INTO sales (
        location_id,
        user_id,
        client_id,
        subtotal,
        discount_total,
        tax_total,
        total_cost,
        total_profit,
        is_wholesale,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *
    `;

    const values = [
      data.location_id,
      data.user_id,
      data.client_id,
      data.subtotal,
      data.discount_total || 0,
      data.tax_total || 0,
      data.total_cost,
      data.total_profit,
      data.is_wholesale,
      data.created_by,
    ];

    const result = await client.query(query, values);

    return result.rows[0];
  }

  static async listSales({
    location_id,
    page = 1,
    limit = 10,
    client_id,
    name,
  }) {
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];
    let param = 1;

    if (location_id) {
      conditions.push(`s.location_id = $${param++}`);
      values.push(location_id);
    }
    if (client_id) {
      conditions.push(`s.client_id = $${param++}`);
      values.push(client_id);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    values.push(limit);
    values.push(offset);

    const query = `
    SELECT
      s.id,
      s.client_id,
      s.subtotal,
      s.discount_total,
      s.tax_total,
      s.total_cost,
      s.total_profit,
      s.is_wholesale,
      s.created_at,

      COUNT(si.id) AS items_count

    FROM sales s

    LEFT JOIN sales_items si
      ON si.sale_id = s.id

    ${whereClause}

    GROUP BY s.id

    ORDER BY s.created_at DESC

    LIMIT $${param++}
    OFFSET $${param++}
  `;

    const result = await pool.query(query, values);

    return result.rows;
  }
  static async retrieveSaleDetail({ id, location_id }) {
    const saleResult = await pool.query(
      `
    SELECT
      s.*,
      c.name AS client_name,
      u.name AS user_name
    FROM sales s
    LEFT JOIN clients c
      ON c.id = s.client_id
    LEFT JOIN users u
      ON u.id = s.user_id
    WHERE s.id = $1
      AND s.location_id = $2
    `,
      [id, location_id],
    );

    const sale = saleResult.rows[0];

    if (!sale) {
      return null;
    }

    const itemsResult = await pool.query(
      `
    SELECT *
    FROM sales_items
    WHERE sale_id = $1
    `,
      [sale.id],
    );

    const items = itemsResult.rows;

    if (!items.length) {
      sale.sales_items = [];
      return sale;
    }

    const saleItemIds = items.map((item) => item.id);

    const componentsResult = await pool.query(
      `
    SELECT
      sic.*,
      c.name AS component_name
    FROM sale_item_components sic
    JOIN components c
      ON c.id = sic.component_id
    WHERE sic.sale_item_id = ANY($1)
    `,
      [saleItemIds],
    );

    const containersResult = await pool.query(
      `
    SELECT
      sit.*,
      c.name AS container_name
    FROM sale_item_containers sit
    JOIN containers c
      ON c.id = sit.container_id
    WHERE sit.sale_item_id = ANY($1)
    `,
      [saleItemIds],
    );

    const componentsMap = new Map();

    for (const component of componentsResult.rows) {
      if (!componentsMap.has(component.sale_item_id)) {
        componentsMap.set(component.sale_item_id, []);
      }

      componentsMap.get(component.sale_item_id).push(component);
    }

    const containersMap = new Map();

    for (const container of containersResult.rows) {
      containersMap.set(container.sale_item_id, container);
    }

    sale.sales_items = items.map((item) => ({
      ...item,
      sales_components: componentsMap.get(item.id) || [],
      sales_container: containersMap.get(item.id) || null,
    }));

    return sale;
  }
}
