export class SaleItemModel {
  static async createSaleItem (client, data) {
    const query = `
      INSERT INTO sales_items (
        sale_id,
        formula_id,
        formula_name_snapshot,
        quantity,
        subtotal,
        discount,
        tax,
        total_cost,
        formula_unit_price,
        formula_base_price
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *
    `

    const values = [
      data.sale_id,
      data.formula_id,
      data.formula_name_snapshot ?? null,
      data.quantity,
      data.subtotal,
      data.discount,
      data.tax,
      data.total_cost,
      data.formula_unit_price ?? null,
      data.formula_base_price ?? null
    ]

    const result = await client.query(query, values)

    return result.rows[0]
  }
}
