const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const codeRoutes = require("./routes/codeRoutes");

dotenv.config();
const app = express();

app.use(cors({
  origin: true, // ✅ Dynamically reflects origin
  credentials: true, // If you're using cookies/auth
}));

app.use(express.json());
app.use("/run", codeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
