import { BrandModel } from "../models/brandModel.js";
import { brandSchema, updateBrandSchema } from "../shemas/brandShemas.js";

export class BrandController {
  static async createBrand(req, res) {
    //recover the user info of middleWare
    try {
      console.log(req.user, "ESTE ES MI REQUEST");
      const userId = req.user.id; // it is from middleware
      const verify = brandSchema.safeParse(req.body);
      if (!userId) {
        return res.status(400).json({ error: "User not provided" });
      }
      if (!verify.success) {
        return res.status(400).json({
          error: verify.error.format(),
        });
      }
      const { name, weight } = req.body;
      //if weight is true, positive for KG and false is L
      const result = await BrandModel.createBrand({ name, userId, weight });

      if (!result) {
        return res.status(400).json({ error: "Brand not created" });
      }

      res.status(201).json({
        message: "BRAND CREATED",
        brand: result,
      });
    } catch (error) {
      console.log(error);
      // handle duplicate error
      if (error.code === "23505") {
        return res.status(400).json({
          error: "User already has a brand",
        });
      }
      res.status(500).json({ error: "Error creating brand" });
    }
  }

  static async deleteBrand(req, res) {
    try {
      const userId = req.user.id; // it is from middleware

      if (!userId) {
        return res.status(400).json({ error: "User not provided" });
      }

      const result = await BrandModel.deleteBrand({ userId });
      console.log(result);
      if (!result) {
        return res.status(400).json({
          error: "error delete Brand",
        });
      }

      res.status(200).json({
        message: "BRAND DELETE SUCCESSFULLY",
      });
    } catch (error) {
      res.status(404).json({ error: "Error,brand not found" });
    }
  }

  static async updateBrand(req, res) {
    try {
      const userId = req.user.id;

      const result = updateBrandSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: result.error.format(),
        });
      }

      const { name, weight } = result.data;

      const updatedBrand = await BrandModel.updateBrand({
        userId,
        name,
        weight,
      });

      if (!updatedBrand) {
        return res.status(404).json({
          error: "Brand not found",
        });
      }

      res.status(200).json({
        message: "Brand updated",
        brand: updatedBrand,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Error updating brand",
      });
    }
  }

  static async viewBrand(req, res) {
    try {
      const userId = req.user.id;

      if (!userId) {
        return res.status(400).json({ error: "User not provided" });
      }

      const brand = await BrandModel.viewBrand({ userId });

      if (!brand) {
        return res.status(404).json({
          error: "Brand not found",
        });
      }

      res.status(200).json({
        brand,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Error retrieving brand",
      });
    }
  }
}
