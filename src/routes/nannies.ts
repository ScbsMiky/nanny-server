import express, { type Express } from "express";
import accounts from "../database/models/accounts";
import { compareDates, weightedAverage } from "../utils/util";

const router = express.Router( );

router.get("/recent", function(req, res) {
  let { page, limit } = req.query;

  let _page = typeof page != "number" ? 0 : Number(page);
  let _limit = typeof limit != "number" ? 100 : Number(limit);

  res.send({
    nannies: accounts
      .toArray( )
      .filter((account) => account.nanny.isNanny)
      .slice(_page * _limit, (_page + 1) * _limit)
      .sort((a, b) => compareDates(a.createdAt, b.createdAt) ? 1 : -1)
      .map((nanny) => ({
        ...nanny.social,
        ...nanny.nanny
      }))
  });
});

router.get("/best", function(req, res) {
  let { page, limit } = req.query;

  let _page = typeof page != "number" ? 0 : Number(page);
  let _limit = typeof limit != "number" ? 100 : Number(limit);

  res.send({
    nannies: accounts
      .toArray( )
      .filter((account) => account.nanny.isNanny)
      .slice(_page * _limit, (_page + 1) * _limit)
      .sort((a, b) => nannyWeightedAverage(a.nanny.rating, b.nanny.rating))
      .map((nanny) => ({
        ...nanny.social,
        ...nanny.nanny
      }))
  });
});

export function nannyWeightedAverage(a: Record<string, number>, b: Record<string, number>) {
  return weightedAverage(a.bad, a.good, a.neutral, a.veryBad, a.veryGood)
       + weightedAverage(b.bad, b.good, b.neutral, b.veryBad, b.veryGood);
};

export default function registry(app: Express) {
  return app.use("/api/nanny", router);
};