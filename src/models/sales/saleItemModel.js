export class SaleItemModel {
  static async createSaleItem(client, data) {
    const query = `
      INSERT INTO sales_items (
        sale_id,
        formula_id,
        quantity,
        subtotal,
        discount,
        tax,
        total_cost
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7
      )
      RETURNING *
    `;

    const values = [
      data.sale_id,
      data.formula_id,
      data.quantity,
      data.subtotal,
      data.discount,
      data.tax,
      data.total_cost,
    ];

    const result = await client.query(query, values);

    return result.rows[0];
  }
}
