import express, { type Express } from "express";

import authenticationMiddleware from "../middlewares/authentication";

import upload from "../middlewares/upload";
import accounts from "../database/models/accounts";

import { decryptAccount, getAge, randomUUID } from "../utils/util";
import cipher from "../libs/cipher";
import { emailTransporter } from "../utils/email";
import dotenv from "../../../../libraries/dotenv";
import { getRandomRange } from "../libs/aika/src/util";

const router = express.Router( );

router.get("/fetch", function(req, res) {
  const { id } = req.query;

  if(typeof id != "string" || id.length <= 0) {
    res.send({
      error: "Você precisa informar o ID do usuario que deseja buscar"
    });

    return;
  };

  const account = accounts.find((account) => id == account.cache.id);

  if(!account) {
    res.send({
      error: "Nenhum usuario foi encontrado com essa ID"
    })

    return;
  };

  res.send({
    account: decryptAccount(account.cache)
  });
});

router.post("/create", upload.single("cpf-photo"), upload.single("rg-photo"), function(req, res) {
  let { birthDate, password, address, gender, phone, email, name, cpf, rg } = (req.body || { });

  birthDate = new Date(birthDate);

  if(!rg) {
    res.send({ error: "Você precisa informar o seu RG" });

    return;
  };

  if(!cpf) {
    res.send({ error: "Você precisa informar o seu CPF" });

    return;
  };

  if(!phone) {
    res.send({ error: "Você precisa informar o seu numero de celular" });

    return;
  };

  if(!email) {
    res.send({ error: "Você precisa informar o seu e-mail" });

    return;
  };

  if(!password) {
    res.send({ error: "Você precisa informar uma senha" });

    return;
  };

  if(typeof address != "object") {
    res.send({ error: "Você precisa informar o seu endereço" });

    return;
  };
  
  if(typeof address.city != "string") {
    res.send({ error: "Você precisa informar a sua cidade" });

    return;
  };

  if(typeof address.state != "string") {
    res.send({ error: "Você precisa informar em que estado você mora" });

    return;
  };

  if(typeof address.number != "string") {
    res.send({ error: "Você precisa informar o numero da sua casa" });

    return;
  };

  if(typeof address.landmark != "string") {
    res.send({ error: "Você precisa informar uma referencia da sua casa" });

    return;
  };

  if(typeof address.neighborhood != "string") {
    res.send({ error: "Você precisa informar o seu bairro" });

    return;
  };

  if(birthDate.toString( ) == "Invalid Date") {
    res.send({ error: "Data de nascimento invalida" });

    return;
  };

  if(getAge(birthDate) < 18) {
    res.send({ error: "Você precisa ser maior de 18 anos para poder usar a plataforma" });

    return;
  };

  rg = cipher.encrypt(rg.toLowerCase( ) as string);
  cpf = cipher.encrypt(rg.toLowerCase( ) as string);
  
  phone = cipher.encrypt(phone as string);

  email = cipher.encrypt(email.toLowerCase( ) as string);
  password = cipher.encrypt(password as string);

  if(accounts.find(({ cache }) => (cache.private.email == email))) {
    res.send({ error: "Esse e-mail já esta em uso" });

    return;
  };

  const account = accounts.create({
    id: randomUUID( ),
    
    social: {
      name,
      gender
    },

    private: {
      rg,
      cpf,
      phone,

      email,
      password,

      birthDate: cipher.encrypt(birthDate.toISOString( ) as string),

      address: {
        city: cipher.encrypt(address.city as string),
        state: cipher.encrypt(address.state as string),
        number: cipher.encrypt(address.number as string),
        landmark: cipher.encrypt(address.landmark as string),
        neighborhood: cipher.encrypt(address.neighborhood as string),
      }
    }
  });

  account.save( );

  res.send({
    account: decryptAccount(account.cache),
    authorization: cipher.encrypt(JSON.stringify({ password, email }))
  });

  return;
});

router.post("/signin", authenticationMiddleware, function(req, res) {
  res.send({
    account: decryptAccount({
      ...res.locals.account,
      private: {
        ...res.locals.account.private,
      }
    }),
    authorization: cipher.encrypt(JSON.stringify({
      email: res.locals.account.private.email,
      password: res.locals.account.private.password
    }))
  });
  
  return;
});

router.post("/delete", authenticationMiddleware, function(req, res) {
  const found = accounts.find((account) => account.cache.id == res.locals.account.id);

  if(!found) {
    res.send({ error: "Não foi possivel encontrar o usuario para deletar" });

    return;
  };

  found.delete( );

  res.send({ message: "Conta deletada com sucesso" });
  
  return;
});

router.post("/update", authenticationMiddleware, function(req, res) {
  const body = (req.body || { });

  if(body.name && typeof body.name == "string") res.locals.account.social.name = body.name;
  if(body.about && typeof body.about == "string") res.locals.account.social.about = body.about;
  if(body.gender && typeof body.gender == "string") res.locals.account.social.gender = body.gender;
  if(body.shortAbout && typeof body.shortAbout == "string") res.locals.account.social.shortAbout = body.shortAbout;

  // if(body.experiences) res.locals.account.nanny.experiences = body.experiences;
  // if(body.pricePerHour) res.locals.account.nanny.pricePerHour = body.pricePerHour;
  // if(body.qualifications) res.locals.account.nanny.qualifications = body.qualifications;

  accounts.set(res.locals.account.id, res.locals.account);
});

router.post("/forgot-password", function(req, res) {
  const { action, code, email, password } = (req.body || { });

  if(!action) {
    res.send({ error: "Você precisa informar que tipo de ação quer tomar" });
    return;
  };

  if(!email) {
    res.send({ error: "Você precisa informar o email vinculado a conta que deseja recuperar" });
    return;
  };

  const cryptedEmail = cipher.encrypt(email.toLowerCase( ));

  const account = accounts.find((account) => {
    return account.cache.private.email == cryptedEmail;
  });

  if(!account) {
    res.send({
      error: "Nenhuma conta esta vinculada a esse email"
    });

    return;
  };

  if(action == "get-code") {
    account.cache.private.code = getRandomRange(999_999, 100_000, false).toString( );
    
    account.save( );

    emailTransporter.sendMail({
      from: dotenv.Required("mail_email").ToString( ),
      to: email,
      subject: "Recuperação de conta",
      text: `O seu codigo de recuperação de conta é: ${account.cache.private.code}`
    }, (error) => {
      if(error) {
        res.send({
          error: error.message
        });
  
        return;
      };

      res.send({
        validEmail: true
      });
    });

    return;
  };

  if(action == "set-code") {
    if(!code) {
      res.send({
        error: "Você precisa informar o codigo de recuperação de conta"
      });

      return;
    };

    if(account.cache.private.code != code) {
      res.send({
        error: "O codigo de recupeção de conta não corresponde ao original"
      });

      return;
    };

    account.cache.private.code = "valid";
    
    account.save( );

    res.send({
      validCode: true,
      validEmail: true,
    });

    return;
  };

  if(action == "set-password") {
    if(!password) {
      res.send({
        error: "Você precisa informar a sua nova senha"
      });

      return;
    };

    if(account.cache.private.code != "valid") {
      res.send({
        error: "Você precisa validar o codigo de recuperação de conta antes de poder alterar a senha da conta"
      });

      return;
    };

    account.cache.private.password = cipher.encrypt(password as string);
    
    account.save( );

    res.send({
      account: decryptAccount(account.cache),
      authorization: cipher.encrypt(JSON.stringify({
        email: account.cache.private.email,
        password: account.cache.private.password,
      }))
    });

    return;
  };

  res.send({
    error: "Ação invalida"
  });

  return;
});

export default function registry(app: Express) {
  app.use("/api/account", router);
};