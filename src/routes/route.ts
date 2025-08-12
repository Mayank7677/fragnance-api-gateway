import express from "express";
import { getProductsWithVariantsByCollection } from "../controllers/collectionProducts.controller";

const router = express.Router();


router.get('/collections/:collectionId/products-with-variants' , getProductsWithVariantsByCollection)

export default router;