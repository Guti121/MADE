import { validateSchema } from "../../helpers/validateSchema.js";
import { SaleModel } from "../../models/sales/saleModel.js";
import { SaleService } from "../../services/sales/saleService.js";
import {
  createSaleSchema,
  getSaleSchema,
  retrieveSaleSchema,
} from "../../shemas/sales/salesSchemas.js";

export class SaleController {
  static async createSale(req, res) {
    try {
      const { id: userId } = req.user;
      const { id: brandId } = req.brand;

      const { data, error } = validateSchema(createSaleSchema, req.body);

      if (error) {
        return res.status(400).json({
          error,
        });
      }

      const result = await SaleService.createSale({
        userId,
        brandId,
        data,
      });

      if (!result) {
        return res.status(400).json({
          error: "Error creating sale",
        });
      }

      return res.status(201).json({
        message: "SALE CREATED SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(error.status || 500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  static async listSales(req, res) {
    try {
      const { data, error } = validateSchema(getSaleSchema, req.query);
      if (error) {
        return res.status(400).json({
          error,
        });
      }
      const result = await SaleModel.listSales({
        location_id: data.location_id,
        page: data.name,
        limit: data.name,
        client_id: data.name,
        name: data.name,
      });

      return res.status(200).json({
        data: result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message,
      });
    }
  }

  static async retrieveSale(req, res) {
    try {
      const { data, error } = validateSchema(retrieveSaleSchema, req.query);
      if (error) {
        return res.status(400).json({
          error,
        });
      }
      const result = await SaleModel.retrieveSaleDetail({
        id: data.id_sale,
        location_id: data.id,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message,
      });
    }
  }
}
