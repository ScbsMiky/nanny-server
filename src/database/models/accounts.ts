import Aika from "../../libs/aika";

export default new Aika(`${__dirname}\\..\\files\\accounts.aika`, {
  id: "",
  createdAt: "",
  
  suspension: {
    is: false,

    end: "",
    start: "",
    reason: "",
  },

  // work
  nanny: {
    isNanny: false,

    pricePerHour: 0,
    
    experiences: [ ] as { with: "", end: "", start: "" }[ ],
    
    qualifications: [ ] as string[ ],
    
    rating: {
      bad: 0,
      good: 0,
      neutral: 0,
      veryBad: 0,
      veryGood: 0
    }
  },

  // normal data
  social: {
    name: "",
    about: "",
    gender: "",
    avatar: "default.png",
    shortAbout: "",
  },
  
  // crypted data
  private: {
    rg: "",
    cpf: "", 
    code: "",
    phone: "",
    
    email: "",
    password: "",
    birthDate: "",

    address: {
      city: "",
      state: "",
      number: "",
      landmark: "",
      neighborhood: "",
    },

    // admin level
    permission: -1
  }
});