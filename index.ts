import fs from "fs";
import express from "express";

import pretty from "./src/libs/pretty-print";

import { networkInterfaces } from "os";

const app = express( );

app.use(express.json( ));
app.use(express.urlencoded({ extended: false }));

app.use(express.static(`${__dirname}\\src\\public`));

app.use((req, res, next) => {
  console.log("REQUEST");
  return next( );
});

const routePath = `${__dirname}\\src\\routes`;
fs.readdirSync(routePath).map((routeName) => {
  routeName = `${routePath}\\${routeName}`;
  
  try {
    import(routeName).then((imported) => {
      imported.default(app);
      pretty.Log(`Router <yellow>${routeName.replace(`${routePath}\\`, "")}</yellow> loaded`);
    });
  } catch (error: any) {
    pretty.Log(`Fail to load router <yellow>${routeName.replace(`${routePath}\\`, "")}</yellow> (Reason: <green>${error.message}</green>)`);
  };
});

const ip = networkInterfaces( )["Ethernet"]![3].address;

app.listen(3000, ip, ( ) => pretty.Log(`Server running on <yellow>http://${ip}:<green>3000</green></yellow>`))