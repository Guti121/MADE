export class StockMovementModel {
  static async createMovement(client, data) {
    const query = `
      INSERT INTO stock_movements (
        stock_id,
        location_id,
        movement_type,
        quantity,
        unit_price,
        total_price,
        notes,
        reference_id,
        reference_type,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *
    `;

    console.log(data.stock_id);

    const values = [
      data.stock_id,
      data.location_id,
      data.movement_type,
      data.quantity,
      data.unit_price,
      data.total_price,
      data.reason || null,
      data.reference_id || null,
      data.reference_type || null,
      data.created_by,
    ];

    const result = await client.query(query, values);

    return result.rows[0];
  }
}
