import { validateSchema } from "../../helpers/validateSchema.js";
import { StockContainerModel } from "../../models/containers/stockContainerModel.js";
import { BussinesLogicStockContainer } from "../../services/containers/LogicStockContainers.js";
import { StockContainerService } from "../../services/containers/stockContainerServices.js";
import { BussinesLogicStock } from "../../services/stock/bussinesLogicStock.js";
import { StockService } from "../../services/stock/stockServices.js";
import {
  createStockContainerSchema,
  deleteStockContainerSchema,
  ListStockContainerSchema,
  registerLossStockContainerSchema,
  retrieveStockContainerSchema,
  updateStockContainerSchema,
} from "../../shemas/containers/stockContainersSchema.js";

export class StockContainerController {
  static async createStockContainer(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(
        createStockContainerSchema,
        req.body,
      );
      console.log("Validated");

      if (error) {
        return res.status(400).json({ error });
      }

      //Logic for Unit value
      const unitsPrice = await BussinesLogicStockContainer.convertValueUnits({
        value: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price,
      });
      console.log(unitsPrice);

      const result = await StockContainerService.createStockContainer({
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
        error: error || "Internal server error",
      });
    }
  }

  static async deleteStockContainer(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(
        deleteStockContainerSchema,
        req.query,
      );

      if (error) {
        return res.status(400).json({ error });
      }

      const result = await StockContainerModel.deleteStockContainer({
        userId,
        data,
      });
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
  static async updateStockContainer(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(
        updateStockContainerSchema,
        req.body,
      );
      if (error) {
        return res.status(400).json({ error });
      }

      //Logic for Unit value
      const unitsPrice = await BussinesLogicStockContainer.convertValueUnits({
        value: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price,
      });

      console.log(unitsPrice, "HELLO");

      const stock = await StockContainerModel.retrieveStockContainer({
        stockId: data.stock_id,
        location_id: data.location_id,
        container_id: data.container_id,
      });

      console.log(stock, "hello");
      const AVGPrice = await BussinesLogicStock.calculeteAVGPrice({
        stock,
        data: unitsPrice,
      });

      if (!AVGPrice) {
        return res.status(400).json({ error: "Error in AVG Price" });
      }
      console.log("container", data.container_id, AVGPrice);
      const result = await StockContainerService.updateStockContainer({
        stockId: data.stock_id,
        userId,
        location_id: data.location_id,
        container_id: data.container_id,
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

  static async registerLossContainer(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(
        registerLossStockContainerSchema,
        req.body,
      );
      if (error) {
        return res.status(400).json({ error });
      }

      const stock = await StockContainerModel.retrieveStockContainer({
        stockId: data.stock_id,
        location_id: data.location_id,
        container_id: data.container_id,
      });

      if (!stock) {
        return res.status(404).json({ error: "Not found" });
      }

      // .....................LOGIC FOR LOSS ............................
      const currentStock = Number(stock.quantity);

      const lostUnitsStock = Number(data.quantity_base);

      if (currentStock < lostUnitsStock) {
        throw new Error("Stock is lower than loss units");
      }
      console.log(currentStock, lostUnitsStock);
      const smallSizeLoss = currentStock - lostUnitsStock;

      if (!smallSizeLoss) {
        return res.status(404).json({ error: "Error with result" });
      }
      // .....................LOGIC FOR LOSS ............................

      const result = await StockContainerService.registerLossContainer({
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

  static async registerAdjustmentContainer(req, res) {
    try {
      const { id: userId } = req.user;
      const { data, error } = validateSchema(
        registerLossStockContainerSchema,
        req.body,
      );
      console.log("dATA", data);
      if (error) {
        return res.status(400).json({ error });
      }

      const stock = await StockContainerModel.retrieveStockContainer({
        stockId: data.stock_id,
        location_id: data.location_id,
        container_id: data.container_id,
      });

      if (!stock) {
        return res.status(404).json({ error: "Not found" });
      }
      // .....................LOGIC FOR LOSS ............................
      const currentStock = Number(stock.quantity);

      const lostUnitsStock = Number(data.quantity_base);

      if (currentStock < lostUnitsStock) {
        throw new Error("Stock is lower than loss units");
      }
      console.log(currentStock, lostUnitsStock);
      const smallSizeAdjust = currentStock + lostUnitsStock;

      if (!smallSizeAdjust) {
        return res.status(404).json({ error: "Error with result" });
      }
      // .....................LOGIC FOR LOSS ............................
      const result = await StockContainerService.registerAdjustContainer({
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

  static async retrieveStockContainer(req, res) {
    try {
      const { data, error } = validateSchema(
        retrieveStockContainerSchema,
        req.query,
      );
      console.log(data, "data");
      if (error) {
        return res.status(400).json({ error });
      }
      console.log({ stock_id: data.id_stock, location_id: data.id });

      const result = await StockContainerModel.retrieveStockContainer({
        stockId: data.id_stock,
        location_id: data.id,
        container_id: data.container,
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
  static async listStock(req, res) {
    try {
      const { id: brandId } = req.brand;
      const { data, error } = validateSchema(
        ListStockContainerSchema,
        req.query,
      );

      if (error) {
        return res.status(400).json({ error });
      }

      console.log("entramos", data, "aaaaaaaaaaaaaaa");
      const result = await StockContainerModel.listStockContainer({
        brand_id: brandId,
        page: data.page,
        limit: data.limit,
        name: data.name,
        location: data.id,
        type_container: data.type_container,
      });
      console.log(result, "result");
      if (!result) {
        return res.status(404).json({ error: "not fount Stock container" });
      }
      return res.status(200).json({
        message: "LIST SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Internal server error",
      });
    }
  }
}
