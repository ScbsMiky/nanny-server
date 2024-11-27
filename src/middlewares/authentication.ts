import type { NextFunction, Request, Response } from "express";

import cipher from "../libs/cipher";

import accounts from "../database/models/accounts";

export default function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
  let { email, password } = req.body;

  const { authorization } = req.headers;

  if(authorization) {
    try {
      let data = JSON.parse(cipher.decrypt(authorization));
      
      email = data.email;
      password = data.password;
    } catch (error) {
      res.send({
        error: "Não foi possivel analizar a sua autorização"
      });

      return;
    };
  } else {
    if(!email || !password) {
      res.send({
        error: "Insira suas credenciais"
      });
  
      return;
    };

    email = cipher.encrypt(email.toLowerCase( ));
    password = cipher.encrypt(password);
  };

  res.locals.account = accounts.find(({ cache }) => (cache.private.email == email) && (cache.private.password == password));

  if(!res.locals.account) {
    res.send({
      error: authorization ? "Authorização invalida" : "Email ou Senha incorreto(s)"
    });

    return;
  };

  res.locals.account = res.locals.account.cache;

  return next( );
};