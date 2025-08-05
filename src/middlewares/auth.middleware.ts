import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
export interface AuthenticatedRequest extends Request {
  user?: any;
}
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // verify the token
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    );
    if (!decoded) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const userId = (decoded as any).userId;

    const internalToken = jwt.sign({ userId }, process.env.INTERNAL_SECRET!, {
      expiresIn: "5m",
    });

    res.setHeader("x-internal-token", internalToken);

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
