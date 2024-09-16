import { NextFunction, Request, Response } from "express";

export const AuthenticationCheck = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ((req.headers["key"] && req.headers["key"] == process.env.Key) ?? "") {
    next();
  } else {
    res.status(403).json({ message: "Nie masz uprawnien do tego miejsca :)" });
  }
};
