const mongoose = require('mongoose');

module.exports = async () => {
  const mongoUrl =
    'mongodb+srv://pratik:KJVMjP5DcssRMhlk@cluster0.o1yntet.mongodb.net/?retryWrites=true&w=majority';

  try {
    const connect = await mongoose.connect(mongoUrl);
    console.log(`MongoDB connect: ${connect.connection.host}`);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
