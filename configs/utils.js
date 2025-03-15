//  Generate reference for transactions
function generateUniqueID() {
    length = 8;
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   
    let random = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      random += characters.charAt(randomIndex);
    }
  
   return random;
  }


  module.exports = {
    generateUniqueID
  }