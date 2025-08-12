// controllers/collectionProducts.controller.ts
import axios from "axios";
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { AppError } from "../utils/appError";

interface ProductResponseData {
  products: any[];
  total: number;
}

interface VariantListResponse {
  variants: any[]; // Replace `any` with your Variant type
}

export const getProductsWithVariantsByCollection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { collectionId } = req.params;
    if (!collectionId) {
      return next(new AppError("Collection ID is required", 400));
    }

    // Extract pagination/filter/sort params from query
    const {
      page = 1,
      limit = 10,
      search,
      gender,
      isFeatured,
      isActive,
      tags,
      sortBy = "createdAt", // default sort
      order = "desc",
      priceMin,
      priceMax,
    } = req.query;

    // 1️⃣ Call product-service
    const productServiceUrl = `${process.env.PRODUCT_SERVICE_URL}/api/products/by-collection/${collectionId}`;
    const productResponse = await axios.get<ProductResponseData>(
      productServiceUrl,
      {
        params: {
          page,
          limit,
          search,
          gender,
          isFeatured,
          isActive,
          tags,
          sortBy,
          order,
        },
      }
    );

    const products = productResponse.data?.products || [];
    const total = productResponse.data?.total || 0;

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        page: +page,
        totalPages: 0,
        products: [],
      });
    }

    // 2️⃣ Get all product IDs
    const productIds = products.map((p: any) => p._id);

    // 3️⃣ Call inventory-service for variants of multiple products
    const inventoryServiceUrl = `${process.env.INVENTORY_SERVICE_URL}/api/variants/by-product-ids`;
    const variantResponse = await axios.post<VariantListResponse>(
      inventoryServiceUrl,
      { productIds }
    );

    let variants = variantResponse.data?.variants || [];

    // 4️⃣ Optional price filter (from variants)
    if (priceMin || priceMax) {
      const min = priceMin ? Number(priceMin) : 0;
      const max = priceMax ? Number(priceMax) : Infinity;
      variants = variants.filter((v: any) => {
        return v.price >= min && v.price <= max;
      });
    }

    // 5️⃣ Merge variants into products
    const mergedProducts = products.map((product: any) => {
      const productVariants = variants.filter(
        (v: any) => v.productId === product._id
      );
      return {
        ...product,
        variants: productVariants,
      };
    });

    // 6️⃣ Optional sort by price
    if (sortBy === "price") {
      mergedProducts.sort((a: any, b: any) => {
        const aPrice = a.variants[0]?.price || 0;
        const bPrice = b.variants[0]?.price || 0;
        return order === "asc" ? aPrice - bPrice : bPrice - aPrice;
      });
    }

    // 7️⃣ Send final response
    res.status(200).json({
      success: true,
      total,
      page: +page,
      pageSize: mergedProducts.length,
      totalPages: Math.ceil(total / +limit),
      products: mergedProducts,
    });
  } catch (error: any) {
    logger.error("Error fetching products with variants", {
      error: error.message,
    });
    if (error.response) {
      logger.error("Service error details", { data: error.response.data });
    }
    next(error);
  }
};
