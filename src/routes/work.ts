import express, { type Express } from "express";

import authenticationMiddleware from "../middlewares/authentication";
import works from "../database/models/works";
import { getRandomRange } from "../libs/aika/src/util";
import { emailTransporter } from "../utils/email";
import accounts from "../database/models/accounts";
import cipher from "../libs/cipher";
import dotenv from "../../../../libraries/dotenv";

const router = express.Router( );

router.get("/recent", function(req, res) {
  let { page, limit } = req.query;

  let _page = typeof page != "number" ? 0 : Number(page);
  let _limit = typeof limit != "number" ? 100 : Number(limit);

  res.send({
    works: works
      .toArray( )
      .filter((work) => work.nannyId.length == 0)
      .slice(_page * _limit, (_page + 1) * _limit)
      .map((work) => work)
  });
  
  return;
});

router.get("/fetch", function(req, res) {
  const { id } = req.query;

  if(!id) {
    res.send({
      error: "Você precisa informar o ID do serviço que deseja buscar"
    });

    return;
  };

  const work = works.find((work) => work.cache.id == id);

  if(!work) {
    res.send({
      error: "Nenhum serviço com essa ID foi encontrado"
    });

    return;
  };

  res.send({ work: work.cache });

  return;
});

router.post("/create", authenticationMiddleware, function(req, res) {
  const { description, startDate, endDate } = (req.body || { });

  if(works.find((work) => work.cache.customerId == res.locals.account.id) != undefined) {
    res.send({
      error: "Desculpe, mas você já possui serviço em aberto"
    });

    return;
  };

  res.send({
    work: works.create({
      id: getRandomRange(999_999_999, 100_000_000).toString( ),
      
      price: 0,
      discount: 0,
  
      nannyId: "",
  
      endDate: endDate,
      startDate: startDate,
      customerId: res.locals.account.id,
      description: description,
    }).save( ).cache
  });

  return;
});

router.post("/delete", authenticationMiddleware, function(req, res) {
  const work = works.find((work) => work.cache.customerId == res.locals.account.id);

  if(!work) {
    res.send({
      error: "Desculpe, mas você não possui nenhum serviço em aberto"
    });

    return;
  };

  work.delete( );
  
  res.send({
    message: "Serviço deletado com sucesso"
  });

  return;
});

router.post("/finish", authenticationMiddleware, function(req, res) {
  const work = works.find((work) => work.cache.customerId == res.locals.account.id);

  if(!work) {
    res.send({
      error: "Desculpe, mas você não possui nenhum serviço em aberto"
    });

    return;
  };

  work.delete( );

  const wire = accounts.find((account) => account.cache.id == work.cache.nannyId);

  if(!wire) {
    emailTransporter.sendMail({
      to: cipher.decrypt(res.locals.private.email as string),
      from: dotenv.Required("mail_email").ToString( ),
      subject: "Serviço",
      text: `Você finalizou o seu serviço! Gostariamos de avisar que não foi possivel enviar um e-mail para o usuario que você contratou, pois os dados desse usuario foram apagados! Qualquer problema nos reporte! Desde já agradecemos, Equipe: Nanny`
    });
  } else {
    emailTransporter.sendMail({
      to: cipher.decrypt(res.locals.private.email as string),
      from: dotenv.Required("mail_email").ToString( ),
      subject: "Serviço",
      text: `Você finalizou o seu serviço! Não esqueça de avaliar o usuario que prestou o serviço! Qualquer problema nos reporte! Desde já agradecemos, Equipe: Nanny`
    });

    emailTransporter.sendMail({
      to: cipher.decrypt(wire.cache.private.email),
      from: dotenv.Required("mail_email").ToString( ),
      subject: "Serviço",
      text: `O Usuario que te contratou definiu o trabalho como finalizado, parabens pelo seu serviço! Não esqueça de avaliar quem te contratou! Qualquer problema nos reporte! Desde já agradecemos, Equipe: Nanny`
    });
  };

  res.send({
    message: "Você finalizou com sucesso o seu serviço"
  });

  return;
});

router.post("/wire", authenticationMiddleware, function(req, res) {
  const { wireId } = (req.body || { });

  if(!wireId) {
    res.send({
      error: "Você precisa informar a ID de quem deseja contratar"
    });

    return;
  };

  const work = works.find((work) => work.cache.customerId == res.locals.account.id);

  if(!work) {
    res.send({
      error: "Desculpe, mas você não possui nenhum serviço em aberto"
    });

    return;
  };

  if(works.find((_work) => _work.cache.nannyId == wireId) != undefined) {
    res.send({
      error: "Desculpe, mas esse usuario esta prestando serviço para outro usuario"
    });

    return;
  };

  if(work.cache.candidates.includes(wireId) == false) {
    res.send({
      error: "Desculpe, mas esse usuario não se candidatou para o serviço"
    });

    return;
  };

  const wire = accounts.find((account) => account.cache.id == wireId);

  if(!wire) {
    res.send({
      error: "Desculpe, mas não foi possivel localizar os dados desse usuario"
    })

    return;
  };

  work.cache.candidates = [ ];
  work.cache.nannyId = wireId;

  work.save( );

  emailTransporter.sendMail({
    to: cipher.decrypt(wire.cache.private.email),
    from: dotenv.Required("mail_email").ToString( ),
    subject: "Contratação",
    text: `Você foi contratad${wire.cache.social.gender == "male" ? "o" : "a"} por '${res.locals.account.social.name}', . Qualquer problema nos reporte! Desde já agradecemos, Equipe: Nanny`
  });

  emailTransporter.sendMail({
    to: cipher.decrypt(res.locals.private.email as string),
    from: dotenv.Required("mail_email").ToString( ),
    subject: "Contratação",
    text: `Você contratou o usuario '${wire.cache.social.name}' para o serviço. Qualquer problema nos reporte! Desde já agradecemos, Equipe: Nanny`
  });

  res.send({
    message: "Contratação finalizada com sucesso"
  });

  return;
});

router.post("/apply", authenticationMiddleware, function(req, res) {
  const { workId } = (req.body || { });

  if(!workId){
    res.send({
      error: "Você precisa informar o ID do serviço que deseja se candidatar"
    });

    return;
  };
  
  if(works.find((_work) => _work.cache.nannyId == res.locals.account.id) != undefined) {
    res.send({
      error: "Desculpe, mas você não pode se candidatar enquanto esta prestando um serviço"
    });

    return;
  };

  const work = works.find((work) => work.cache.id == workId);

  if(work == undefined) {
    res.send({
      error: "Não foi possivel encontrar nenhum serviço com essa ID"
    });

    return;
  };

  if(work.cache.candidates.includes(res.locals.account.id)) {
    res.send({
      error: "Você já candidatou-se para esse serviço"
    });

    return;
  };

  work.cache.candidates.push(res.locals.account.id);
  work.save( );

  res.send({
    message: "Você candidatou-se com sucesso para o serviço"
  });

  return;
});

router.post("/withdraw", authenticationMiddleware, function(req, res) {
  const { workId } = (req.body || { });

  if(!workId){
    res.send({
      error: "Você precisa informar o ID do serviço que deseja se descandidatar"
    });

    return;
  };

  const work = works.find((work) => work.cache.id == workId);

  if(work == undefined) {
    res.send({
      error: "Não foi possivel encontrar nenhum serviço com essa ID"
    });

    return;
  };

  const index = work.cache.candidates.indexOf(res.locals.account.id);

  if(index <= -1) {
    res.send({
      error: "Você não se candidatou para esse serviço"
    });

    return;
  };

  work.cache.candidates.splice(index, 1);
  work.save( );

  res.send({
    message: "Você se descandidatou do serviço com sucesso"
  });

  return;
});

export default function registry(app: Express) {
  app.use("/api/work", router);
};