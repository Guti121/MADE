import { validateSchema } from "../../helpers/validateSchema.js";
import { ContainerModel } from "../../models/containers/containerModel.js";
import { AccessService } from "../../services/AccessService.js";
import { BussinesLogicStock } from "../../services/stock/bussinesLogicStock.js";
import {
  createContainerSchemas,
  DeleteContainerSchemas,
  ListContainerSchema,
  updateContainerSchemas,
} from "../../shemas/containers/containersSchemas.js";

export class ContainerController {
  static async createContainer(req, res) {
    try {
      const { id: brandId } = req.brand;
      const userId = req.user.id;

      // Validate body
      const { data, error } = validateSchema(createContainerSchemas, req.body);

      if (error) {
        return res.status(400).json({ error });
      }

      // Validate ownership
      const typeContainer = await AccessService.validateTypeContainerAccess({
        typeContainerId: data.type_container,
        userId,
      });

      const newMeassures = await BussinesLogicStock.convertMeasuresStock({
        unit: data.unit,
        quantity_base: data.capacity,
        userId,
      });

      if (!typeContainer) {
        return res.status(403).json({
          error: "Unauthorized type Container",
        });
      }

      // Create Container
      const result = await ContainerModel.createContainer({
        brand_id: brandId,
        params: data,
        newMeassures,
        userId,
      });

      return res.status(201).json({
        message: "CREATED SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  static async updateContainer(req, res) {
    try {
      const { id: brandId } = req.brand;
      const userId = req.user.id;

      const { data, error } = validateSchema(updateContainerSchemas, req.body);

      if (error) {
        return res.status(400).json({ error });
      }
      // Validate ownership
      let typeContainer;
      if (data?.type_container) {
        typeContainer = await AccessService.validateTypeContainerAccess({
          typeContainerId: data.type_container,
          userId,
        });
      }
      if (data.type_container && !typeContainer) {
        return res.status(403).json({
          error: "Unauthorized type Container",
        });
      }
      let newMeasures;
      if (data?.unit && data?.capacity) {
        newMeasures = await BussinesLogicStock.convertMeasuresStock({
          unit: data.unit,
          quantity_base: data.capacity,
          userId,
        });
      }

      const result = await ContainerModel.updateContainer({
        brandId,
        params: data,
        newMeasures,
        userId,
      });
      if (!result) {
        return res.status(404).json({ error: "Not Found" });
      }
      return res.status(200).json({
        message: "UPDATED SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message || "Internal server error",
      });
    }
  }

  static async deleteContainer(req, res) {
    try {
      const { id: brandId } = req.brand;
      const { data, error } = validateSchema(DeleteContainerSchemas, req.query);
      if (error) {
        return res.status(400).json({ error });
      }

      //Delete Container
      const result = await ContainerModel.deleteContainer({
        brandId,
        params: data,
      });

      if (!result) {
        return res.status(404).json({ error: "not fount Container" });
      }
      return res.status(201).json({
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

  static async listContainer(req, res) {
    try {
      const { id: brandId } = req.brand;
      const { data, error } = validateSchema(ListContainerSchema, req.query);

      if (error) {
        return res.status(400).json({ error });
      }

      console.log("entramos");
      const result = await ContainerModel.listContainer({
        brand_id: brandId,
        page: data.page,
        limit: data.limit,
        name: data.name,
        capacity: data.capacity,
        type_container: data.type_container,
      });
      console.log(result, "result");
      if (!result) {
        return res.status(404).json({ error: "not fount Container" });
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
