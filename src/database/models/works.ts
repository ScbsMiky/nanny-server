import Aika from "../../libs/aika";

export default new Aika(`${__dirname}\\..\\files\\works.aika`, {
  id: "",
  description: "",

  endDate: "",
  startDate: "",

  nannyId: "",
  customerId: "",

  price: 0,
  discount: 0,

  candidates: [ ] as string[ ]
});