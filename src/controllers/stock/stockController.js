import { validateSchema } from "../../helpers/validateSchema.js";
import { stockModel } from "../../models/stock/stockModel.js";
import { BussinesLogicStock } from "../../services/stock/bussinesLogicStock.js";
import { StockService } from "../../services/stock/stockServices.js";
import {
  createStockSchema,
  deleteStockSchema,
  retrieveStockSchema,
  registerLossStockSchema,
  updateStockSchema,
} from "../../shemas/stock/stockSchemas.js";

export class StockController {
  static async createStock(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(createStockSchema, req.body);
      console.log("Validated");

      if (error) {
        return res.status(400).json({ error });
      }

      //Logic for Unit value
      const unitsPrice = await BussinesLogicStock.convertMeasuresStock({
        purchase_price: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        userId,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price,
      });
      console.log(unitsPrice);

      const result = await StockService.createStock({
        userId,
        params: data,
        unitsPrice,
      });

      if (!result) {
        return res.status(404).json({ error: "Error with creation" });
      }
      return res.status(201).json({
        message: "CREATE SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  static async deleteStock(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(deleteStockSchema, req.query);

      if (error) {
        return res.status(400).json({ error });
      }

      const result = await stockModel.deleteStock({ userId, data });
      if (!result) {
        return res.status(404).json({ error: "Stock not found" });
      }
      return res.status(200).json({
        message: "DELETE SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
  static async updateStock(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(updateStockSchema, req.body);
      if (error) {
        return res.status(400).json({ error });
      }

      //Logic for Unit value
      const unitsPrice = await BussinesLogicStock.convertMeasuresStock({
        purchase_price: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        userId,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price,
      });

      console.log(unitsPrice);

      const stock = await stockModel.RetrieveStock({
        stockId: data.stock_id,
        location_id: data.location_id,
        component_id: data.component_id,
      });

      console.log(stock);
      const AVGPrice = await BussinesLogicStock.calculeteAVGPrice({
        stock,
        data: unitsPrice,
      });

      if (!AVGPrice) {
        return res.status(400).json({ error: "Error in AVG Price" });
      }
      console.log("component", data.component_id, AVGPrice);
      const result = await StockService.updateStock({
        stockId: data.stock_id,
        userId,
        location_id: data.location_id,
        component_id: data.component_id,
        unitsPrice,
        AVGPrice,
      });

      if (!result) {
        return res.status(404).json({ error: "Error with update" });
      }
      return res.status(200).json({
        message: "UPDATE SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  static async registerLoss(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(registerLossStockSchema, req.body);
      if (error) {
        return res.status(400).json({ error });
      }

      //Logic for Unit value
      const unitsPrice = await BussinesLogicStock.convertMeasuresStock({
        purchase_price: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        userId,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price,
      });

      console.log(unitsPrice);

      const stock = await stockModel.RetrieveStock({
        stockId: data.stock_id,
        location_id: data.location_id,
        component_id: data.component_id,
      });

      if (!stock) {
        return res.status(404).json({ error: "Not found" });
      }

      const smallSizeLoss = await BussinesLogicStock.registerLoss({
        stock,
        unitsPrice,
      });

      if (!smallSizeLoss) {
        return res.status(404).json({ error: "Error with result" });
      }
      const result = await StockService.registerLoss({
        stock,
        smallSizeLoss,
        userId,
        data,
      });
      if (!result) {
        return res.status(404).json({ error: "Error with Update" });
      }

      return res.status(200).json({
        message: "REGISTER LOSS SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  static async registerAdjustment(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(registerLossStockSchema, req.body);
      if (error) {
        return res.status(400).json({ error });
      }

      //Logic for Unit value
      const unitsPrice = await BussinesLogicStock.convertMeasuresStock({
        purchase_price: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        userId,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price,
      });

      console.log(unitsPrice);

      const stock = await stockModel.RetrieveStock({
        stockId: data.stock_id,
        location_id: data.location_id,
        component_id: data.component_id,
      });

      if (!stock) {
        return res.status(404).json({ error: "Not found" });
      }

      const smallSizeAdjust = await BussinesLogicStock.registerAdjustment({
        stock,
        unitsPrice,
      });

      if (!smallSizeAdjust) {
        return res.status(404).json({ error: "Error with result" });
      }
      const result = await StockService.registerAdjust({
        stock,
        smallSizeAdjust,
        userId,
        data,
      });
      if (!result) {
        return res.status(404).json({ error: "Error with Update" });
      }

      return res.status(200).json({
        message: "REGISTER ADJUST SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }

  static async retrieveStock(req, res) {
    try {
      const { data, error } = validateSchema(retrieveStockSchema, req.query);

      if (error) {
        return res.status(400).json({ error });
      }

      const result = await stockModel.retrieveStock({
        stock_id: data.id_stock,
        location_id: data.id,
      });
      if (!result) {
        return res.status(404).json({ error: "Error not found" });
      }

      return res.status(200).json({
        message: "RETRIEVE SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}
