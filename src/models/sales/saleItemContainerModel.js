export class SaleItemContainerModel {
  static async createContainer (client, data) {
    const query = `
      INSERT INTO sale_item_containers (
        sale_item_id,
        container_id,
        container_name_snapshot,
        quantity_used,
        unit_cost,
        unit_price,
        total_cost,
        total_price
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      RETURNING *
    `

    const values = [
      data.sale_item_id,
      data.container_id,
      data.container_name_snapshot ?? null,
      data.quantity_used,
      data.unit_cost,
      data.unit_price,
      data.total_cost,
      data.total_price
    ]

    const result = await client.query(query, values)

    return result.rows[0]
  }
}
