export class SaleItemComponentModel {
  static async createComponent(client, data) {
    const query = `
      INSERT INTO sale_item_components (
        sale_item_id,
        component_id,
        quantity_used,
        unit_cost,
        unit_price,
        total_cost,
        total_price
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7
      )
      RETURNING *
    `;

    const values = [
      data.sale_item_id,
      data.component_id,
      data.quantity_used,
      data.unit_cost,
      data.unit_price,
      data.total_cost,
      data.total_price,
    ];

    const result = await client.query(query, values);

    return result.rows[0];
  }
}
