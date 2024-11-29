"use strict";

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Ensure JWTSECRET is defined in the environment
const secret = process.env.JWTSECRET;
if (!secret) {
    throw new Error("JWTSECRET environment variable is not defined");
}

// Define a custom request type to include the user in the request body
interface AuthenticatedRequest extends Request {
    body: {
        user?: string | object; // Adjust type if you know the exact structure of the decoded token
    };
}

// Authorization middleware
export const authorization = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const token = req.headers.authorization;

    if (!token) {
        res.status(401).send("Unauthorized: Token not provided");
        return;
    }

    try {
        // Verify the token using the secret
        const decoded = jwt.verify(token, secret);
        req.body.user = decoded; // Attach decoded token to the request body
        next(); // Proceed to the next middleware
    } catch (err) {
        res.status(401).send("Unauthorized: Invalid token");
    }
};
