import { BrandModel } from "../models/brandModel.js";
import { LocationModel } from "../models/locationModel.js";
import {
  deleteLocationSchema,
  locationSchema,
  retrieveLocationSchema,
  updateLocationSchema,
} from "../shemas/locationShemas.js";

export class locationController {
  static async createLocation(req, res) {
    try {
      const userId = req.user.id;

      // validate input
      const result = locationSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: result.error.format(),
        });
      }

      const { name, address } = result.data;

      // get brand linked to this user
      const brand = await BrandModel.viewBrand({ userId });

      if (!brand) {
        return res.status(404).json({
          error: "Brand not found",
        });
      }

      // create location
      const location = await LocationModel.createLocation({
        name,
        address,
        brand_id: brand.id,
      });

      res.status(201).json({
        message: "Location created",
        location,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Error creating location",
      });
    }
  }

  static async deleteLocation(req, res) {
    try {
      const userId = req.user.id; //it is from middleware
      const locationId = deleteLocationSchema.safeParse(req.body);
      if (!locationId.success) {
        return res.status(400).json({
          error: locationId.error.format(),
        });
      }
      if (!userId) {
        return res.status(400).json({ error: "User no provided" });
      }

      // get brand linked to this user
      const brand = await BrandModel.viewBrand({ userId });

      if (!brand) {
        return res.status(404).json({
          error: "Brand not found",
        });
      }

      const result = await LocationModel.deleteLocation({
        brand_id: brand.id,
        locationId,
      });

      if (!result) {
        return res.status(400).json({
          error: "error delete Location",
        });
      }

      res.status(200).json({
        message: "LOCATION DELETE SUCCESSFULLY",
      });
    } catch (error) {
      res.status(404).json({ error: "Error,Locatio not fount" });
    }
  }

  static async updateLocation(req, res) {
    try {
      const userId = req.user.id; //it is from middleware
      const valuesBody = updateLocationSchema.safeParse(req.body);
      if (!valuesBody.success) {
        return res.status(400).json({
          error: valuesBody.error.format(),
        });
      }
      if (!userId) {
        return res.status(400).json({ error: "User no provided" });
      }

      // get brand linked to this user
      const brand = await BrandModel.viewBrand({ userId });

      if (!brand) {
        return res.status(404).json({
          error: "Brand not found",
        });
      }

      const result = await LocationModel.updateLocation({
        brand_id: brand.id,
        valuesBody,
      });

      console.log(result);
      if (!result) {
        return res.status(400).json({
          error: "error delete Location",
        });
      }

      res.status(200).json({
        message: "LOCATION UPDATE SUCCESSFULLY",
        result,
      });
    } catch (error) {
      res.status(404).json({ error: "Error,Location not fount" });
    }
  }

  static async viewLocation(req, res) {
    try {
      const userId = req.user.id; //it is from middleware

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      console.log("user", userId);
      if (!userId) {
        return res.status(400).json({ error: "User no provided" });
      }

      // get brand linked to this user
      const brand = await BrandModel.viewBrand({ userId });

      if (!brand) {
        return res.status(404).json({
          error: "Brand not found",
        });
      }

      const result = await LocationModel.viewLocation({
        brand_id: brand.id,
        page,
        limit,
      });

      if (!result) {
        return res.status(400).json({
          error: "error when searching for locations",
        });
      }

      res.status(200).json({
        message: "LOCATIONS FOUND SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.log(error);
      res.status(404).json({ error: "Error,Locations not fount" });
    }
  }

  static async retrieveLocation(req, res) {
    try {
      const userId = req.user.id; //it is from middleware
      const params = retrieveLocationSchema.safeParse(req.query);
      if (!userId) {
        return res.status(400).json({ error: "User no provided" });
      }

      if (!params.success) {
        return res.status(400).json({
          error: params.error.format(),
        });
      }

      // get brand linked to this user
      const brand = await BrandModel.viewBrand({ userId });

      if (!brand) {
        return res.status(404).json({
          error: "Brand not found",
        });
      }

      const result = await LocationModel.retrieveLocation({
        id: params.data.id,
        brand_id: brand.id,
      });

      if (!result) {
        return res.status(400).json({
          error: "error when searching for locations",
        });
      }

      res.status(200).json({
        message: "LOCATION FOUND SUCCESSFULLY",
        result,
      });
    } catch (error) {
      console.log(error);
      res.status(404).json({ error: "Error,Location not fount" });
    }
  }
}
